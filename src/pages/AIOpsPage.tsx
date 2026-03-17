import { useState } from 'react'
import {
  Activity, Database, MessageSquare, AlertTriangle,
  RefreshCw, Check, X, ChevronDown, ChevronUp,
  Clock, Zap, ThumbsUp, ThumbsDown, Plus,
  Shield, Eye, Search, Send,
} from 'lucide-react'
import { useAIOps } from '../hooks/useAIOps'
import { usePermissions } from '../hooks/usePermissions'
import type {
  InteractionLogEntry, IssueLogEntry, ContextGapEntry,
} from '../hooks/useAIOps'

// ── Theme ──
const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-red-400 bg-red-400/10',
  in_progress: 'text-amber-400 bg-amber-400/10',
  resolved: 'text-green-400 bg-green-400/10',
}

const RESULT_COLORS: Record<string, string> = {
  confident: 'text-green-400',
  fallback: 'text-amber-400',
  no_answer: 'text-red-400',
  error: 'text-red-400',
}

// ── Stat Card ──
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-wider text-cult-text uppercase">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div className={`font-display text-2xl ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-cult-text mt-1">{sub}</div>}
    </div>
  )
}

// ── DB Health Panel ──
function DBHealthPanel({ summary }: { summary: ReturnType<typeof useAIOps>['healthSummary'] }) {
  if (!summary) {
    return (
      <div className="bg-cult-dark border border-cult-border rounded-lg p-6 text-center">
        <Database size={24} className="text-cult-text mx-auto mb-3" />
        <p className="font-mono text-xs text-cult-text">No health snapshots yet</p>
        <p className="font-mono text-[10px] text-cult-text/60 mt-1">
          Nightly cron will populate this after first embed backfill run
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Rows" value={summary.totalRows.toLocaleString()} icon={Database} color="text-cult-gold" />
        <StatCard label="Embedded" value={summary.totalEmbedded.toLocaleString()} icon={Zap} color="text-green-400" sub={`${summary.coveragePct}% coverage`} />
        <StatCard label="Missing" value={summary.totalMissing.toLocaleString()} icon={AlertTriangle} color={summary.totalMissing > 0 ? 'text-amber-400' : 'text-cult-text'} />
        <StatCard label="Superseded" value={summary.totalSuperseded.toLocaleString()} icon={Clock} color="text-cult-text" />
      </div>

      <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-cult-border">
          <span className="font-mono text-[10px] tracking-wider text-cult-text uppercase">Per-Table Breakdown</span>
        </div>
        <div className="divide-y divide-cult-border">
          {summary.tables.map(t => {
            const pct = t.row_count > 0 ? Math.round((t.embedded_rows / t.row_count) * 100) : 0
            return (
              <div key={t.table_name} className="px-4 py-2.5 flex items-center gap-4">
                <span className="font-mono text-xs text-cult-white w-48 truncate">{t.table_name}</span>
                <span className="font-mono text-[10px] text-cult-text w-20 text-right">{t.row_count} rows</span>
                <div className="flex-1 h-1.5 bg-cult-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-cult-text w-12 text-right">{pct}%</span>
                {t.missing_embeddings > 0 && (
                  <span className="font-mono text-[10px] text-amber-400">{t.missing_embeddings} missing</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Interaction Log Panel ──
function InteractionLogPanel({ interactions, stats }: {
  interactions: InteractionLogEntry[];
  stats: ReturnType<typeof useAIOps>['interactionStats']
}) {
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter
    ? interactions.filter(i =>
        (i.intent_classified || '').toLowerCase().includes(filter.toLowerCase()) ||
        (i.category_matched || '').toLowerCase().includes(filter.toLowerCase()) ||
        (i.raw_message || '').toLowerCase().includes(filter.toLowerCase())
      )
    : interactions

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-6 gap-3">
          <StatCard label="Total Queries" value={stats.total} icon={MessageSquare} color="text-cult-gold" />
          <StatCard label="Confident" value={stats.confident} icon={Check} color="text-green-400" sub={`${stats.total > 0 ? Math.round((stats.confident / stats.total) * 100) : 0}%`} />
          <StatCard label="Fallback" value={stats.fallback} icon={AlertTriangle} color="text-amber-400" sub={`${stats.total > 0 ? Math.round((stats.fallback / stats.total) * 100) : 0}%`} />
          <StatCard label="No Answer" value={stats.noAnswer} icon={X} color="text-red-400" />
          <StatCard label="Avg Latency" value={`${stats.avgLatencyMs}ms`} icon={Clock} color="text-cult-text" />
          <StatCard label="Feedback" value={`+${stats.feedbackPositive} / -${stats.feedbackNegative}`} icon={ThumbsUp} color="text-cult-gold" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cult-text" />
        <input
          type="text"
          placeholder="Filter by intent, category, or message..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-cult-dark border border-cult-border rounded-lg pl-9 pr-4 py-2.5 font-mono text-xs text-cult-white placeholder:text-cult-text/50 focus:outline-none focus:border-cult-gold/40"
        />
      </div>

      {/* Log table */}
      <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-cult-border flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wider text-cult-text uppercase">
            Interaction Log ({filtered.length} entries)
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare size={24} className="text-cult-text mx-auto mb-3" />
            <p className="font-mono text-xs text-cult-text">No interactions logged yet</p>
            <p className="font-mono text-[10px] text-cult-text/60 mt-1">
              Queries from the CULT AI widget will appear here
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-cult-border">
            {filtered.map(entry => {
              const expanded = expandedId === entry.id
              return (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-cult-muted/50 transition-colors text-left"
                  >
                    <span className="font-mono text-[10px] text-cult-text w-36 flex-shrink-0">
                      {new Date(entry.queried_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className={`font-mono text-[10px] w-20 flex-shrink-0 ${RESULT_COLORS[entry.result_type || ''] || 'text-cult-text'}`}>
                      {entry.result_type || '—'}
                    </span>
                    <span className="font-mono text-xs text-cult-white truncate flex-1">
                      {entry.intent_classified || entry.raw_message || '—'}
                    </span>
                    <span className="font-mono text-[10px] text-cult-text w-16 flex-shrink-0 text-right">
                      {entry.response_latency_ms != null ? `${entry.response_latency_ms}ms` : '—'}
                    </span>
                    {entry.feedback_score === 1 && <ThumbsUp size={12} className="text-green-400 flex-shrink-0" />}
                    {entry.feedback_score === -1 && <ThumbsDown size={12} className="text-red-400 flex-shrink-0" />}
                    {expanded ? <ChevronUp size={12} className="text-cult-text flex-shrink-0" /> : <ChevronDown size={12} className="text-cult-text flex-shrink-0" />}
                  </button>
                  {expanded && (
                    <div className="px-4 py-3 bg-cult-muted/30 border-t border-cult-border/50 space-y-2">
                      {entry.raw_message && (
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">Message: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.raw_message}</span>
                        </div>
                      )}
                      <div className="flex gap-6">
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">Category: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.category_matched || '—'}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">User: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.user_email || '—'}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">Escalated: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.escalated_to_justin ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      {entry.tables_queried && entry.tables_queried.length > 0 && (
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">Tables Queried: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.tables_queried.join(', ')}</span>
                        </div>
                      )}
                      {entry.feedback_note && (
                        <div>
                          <span className="font-mono text-[10px] text-cult-text uppercase">Feedback: </span>
                          <span className="font-mono text-xs text-cult-white">{entry.feedback_note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Issue Tracker Panel ──
function IssueTrackerPanel({ issues, onResolve }: {
  issues: IssueLogEntry[];
  onResolve: (id: string, note: string) => Promise<void>;
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const openIssues = issues.filter(i => i.status !== 'resolved')
  const resolvedIssues = issues.filter(i => i.status === 'resolved')
  const displayIssues = showResolved ? issues : openIssues

  async function handleResolve(id: string) {
    await onResolve(id, resolveNote)
    setResolvingId(null)
    setResolveNote('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-red-400">{openIssues.length} open</span>
          <span className="font-mono text-[10px] text-cult-text">·</span>
          <span className="font-mono text-xs text-green-400">{resolvedIssues.length} resolved</span>
        </div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="font-mono text-[10px] text-cult-text hover:text-cult-gold transition-colors underline"
        >
          {showResolved ? 'Hide resolved' : 'Show all'}
        </button>
      </div>

      {displayIssues.length === 0 ? (
        <div className="bg-cult-dark border border-cult-border rounded-lg p-8 text-center">
          <Shield size={24} className="text-green-400 mx-auto mb-3" />
          <p className="font-mono text-xs text-cult-text">No open issues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayIssues.map(issue => (
            <div key={issue.id} className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${SEVERITY_COLORS[issue.severity]}`}>
                  {issue.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-cult-white">{issue.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {issue.component && (
                      <span className="font-mono text-[10px] text-cult-text">
                        {issue.component}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-cult-text">
                      {new Date(issue.reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {issue.reported_by && (
                      <span className="font-mono text-[10px] text-cult-text">
                        by {issue.reported_by}
                      </span>
                    )}
                  </div>
                  {issue.auto_triage_suggestion && (
                    <div className="mt-2 px-3 py-2 bg-cult-muted/40 rounded border border-cult-border/50">
                      <span className="font-mono text-[10px] text-cult-text uppercase">Auto-triage: </span>
                      <span className="font-mono text-[10px] text-cult-white">{issue.auto_triage_suggestion}</span>
                    </div>
                  )}
                  {issue.status === 'resolved' && issue.resolution_note && (
                    <div className="mt-2 px-3 py-2 bg-green-400/5 rounded border border-green-400/20">
                      <span className="font-mono text-[10px] text-green-400 uppercase">Resolved: </span>
                      <span className="font-mono text-[10px] text-cult-white">{issue.resolution_note}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono ${STATUS_COLORS[issue.status]}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  {issue.status !== 'resolved' && (
                    resolvingId === issue.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Resolution note..."
                          value={resolveNote}
                          onChange={e => setResolveNote(e.target.value)}
                          className="bg-cult-muted border border-cult-border rounded px-2 py-1 font-mono text-[10px] text-cult-white w-48 focus:outline-none focus:border-cult-gold/40"
                          autoFocus
                        />
                        <button
                          onClick={() => handleResolve(issue.id)}
                          className="p-1 rounded hover:bg-green-400/10 transition-colors"
                        >
                          <Check size={12} className="text-green-400" />
                        </button>
                        <button
                          onClick={() => { setResolvingId(null); setResolveNote('') }}
                          className="p-1 rounded hover:bg-red-400/10 transition-colors"
                        >
                          <X size={12} className="text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(issue.id)}
                        className="font-mono text-[10px] text-cult-text hover:text-green-400 transition-colors"
                      >
                        Resolve
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Context Gap Panel ──
function ContextGapPanel({ gaps, onAdd }: {
  gaps: ContextGapEntry[];
  onAdd: (category: string, key: string, value: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    if (!newCategory || !newKey || !newValue) return
    setSubmitting(true)
    try {
      await onAdd(newCategory, newKey, newValue)
      setNewCategory('')
      setNewKey('')
      setNewValue('')
      setShowAdd(false)
    } catch {
      // handled by hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] text-cult-text">
            {gaps.length} flagged gap{gaps.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cult-gold/10 border border-cult-gold/30 rounded-lg font-mono text-[10px] text-cult-gold hover:bg-cult-gold/20 transition-colors"
        >
          <Plus size={12} />
          Add Context Entry
        </button>
      </div>

      {showAdd && (
        <div className="bg-cult-dark border border-cult-gold/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] text-cult-text uppercase block mb-1">Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. cult_ops, cult_los, context_db_meta"
                className="w-full bg-cult-muted border border-cult-border rounded px-3 py-2 font-mono text-xs text-cult-white placeholder:text-cult-text/40 focus:outline-none focus:border-cult-gold/40"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-cult-text uppercase block mb-1">Key</label>
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. sales_process_context"
                className="w-full bg-cult-muted border border-cult-border rounded px-3 py-2 font-mono text-xs text-cult-white placeholder:text-cult-text/40 focus:outline-none focus:border-cult-gold/40"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] text-cult-text uppercase block mb-1">Value</label>
            <textarea
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="Enter the context knowledge to add..."
              rows={3}
              className="w-full bg-cult-muted border border-cult-border rounded px-3 py-2 font-mono text-xs text-cult-white placeholder:text-cult-text/40 focus:outline-none focus:border-cult-gold/40 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 font-mono text-[10px] text-cult-text hover:text-cult-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newCategory || !newKey || !newValue || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cult-gold/20 border border-cult-gold/40 rounded font-mono text-[10px] text-cult-gold hover:bg-cult-gold/30 transition-colors disabled:opacity-40"
            >
              <Send size={10} />
              {submitting ? 'Adding...' : 'Add to Context DB'}
            </button>
          </div>
        </div>
      )}

      {gaps.length === 0 && !showAdd ? (
        <div className="bg-cult-dark border border-cult-border rounded-lg p-8 text-center">
          <Eye size={24} className="text-cult-text mx-auto mb-3" />
          <p className="font-mono text-xs text-cult-text">No context gaps flagged</p>
          <p className="font-mono text-[10px] text-cult-text/60 mt-1">
            Gaps are flagged when the AI can't find context for a query
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {gaps.map(gap => (
            <div key={gap.id} className="bg-cult-dark border border-cult-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 bg-amber-400/10">
                  {gap.category}
                </span>
                <span className="font-mono text-xs text-cult-gold">{gap.key}</span>
                <span className="font-mono text-[10px] text-cult-text ml-auto">
                  {new Date(gap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="font-mono text-[11px] text-cult-white/80">{gap.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab types ──
type TabKey = 'health' | 'interactions' | 'issues' | 'gaps'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'health', label: 'DB Health', icon: Database },
  { key: 'interactions', label: 'Interaction Log', icon: MessageSquare },
  { key: 'issues', label: 'Issue Tracker', icon: AlertTriangle },
  { key: 'gaps', label: 'Context Gaps', icon: Eye },
]

// ── Main Page ──
export default function AIOpsPage() {
  const { isOwner } = usePermissions()
  const aiOps = useAIOps()
  const [activeTab, setActiveTab] = useState<TabKey>('health')

  // Owner-only gate
  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield size={32} className="text-cult-text mx-auto mb-4" />
          <p className="font-mono text-sm text-cult-text">Owner access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-cult-white tracking-wider">AI OPS</h1>
          <p className="font-mono text-xs text-cult-text mt-1">Context DB observability &middot; Interaction monitoring &middot; Issue tracking</p>
        </div>
        <button
          onClick={aiOps.refresh}
          disabled={aiOps.loading}
          className="flex items-center gap-2 px-4 py-2 bg-cult-dark border border-cult-border rounded-lg font-mono text-xs text-cult-text hover:text-cult-gold hover:border-cult-gold/30 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={aiOps.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {aiOps.error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
          <span className="font-mono text-xs text-red-400">{aiOps.error}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-cult-dark border border-cult-border rounded-lg p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs transition-colors ${
              activeTab === key
                ? 'bg-cult-gold/10 text-cult-gold border border-cult-gold/30'
                : 'text-cult-text hover:text-cult-white hover:bg-cult-muted border border-transparent'
            }`}
          >
            <Icon size={13} />
            {label}
            {key === 'issues' && aiOps.issues.filter(i => i.status !== 'resolved').length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-400/20 text-red-400 text-[9px] font-bold">
                {aiOps.issues.filter(i => i.status !== 'resolved').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {aiOps.loading ? (
        <div className="flex items-center justify-center py-16">
          <Activity size={20} className="text-cult-gold animate-pulse" />
          <span className="font-mono text-xs text-cult-text ml-3">Loading AI Ops data...</span>
        </div>
      ) : (
        <>
          {activeTab === 'health' && <DBHealthPanel summary={aiOps.healthSummary} />}
          {activeTab === 'interactions' && <InteractionLogPanel interactions={aiOps.interactions} stats={aiOps.interactionStats} />}
          {activeTab === 'issues' && <IssueTrackerPanel issues={aiOps.issues} onResolve={aiOps.resolveIssue} />}
          {activeTab === 'gaps' && <ContextGapPanel gaps={aiOps.contextGaps} onAdd={aiOps.addContextEntry} />}
        </>
      )}
    </div>
  )
}
