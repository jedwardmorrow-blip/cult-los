import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { supabase } from '../lib/supabase'
import { Issue, Todo, Rock } from '../types'
import {
  AlertCircle, CheckCircle2, Circle, Plus, TrendingUp, Target, BarChart3,
  Scan, ExternalLink, Check, X, ChevronUp, ChevronDown,
} from 'lucide-react'
import AskClaudeButton from '../components/shared/AskClaudeButton'

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-red-400 bg-red-900/20 border-red-800/30' },
  high: { label: 'High', cls: 'text-amber-400 bg-amber-900/20 border-amber-800/30' },
  medium: { label: 'Medium', cls: 'text-zinc-400 bg-zinc-800/40 border-zinc-700' },
  low: { label: 'Low', cls: 'text-zinc-500 bg-zinc-900/20 border-zinc-800/50' },
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  'slack-scan': { label: 'AI Detected', cls: 'text-purple-400 bg-purple-900/20 border-purple-800/30' },
  'auto-escalation': { label: 'Auto-Escalated', cls: 'text-orange-400 bg-orange-900/20 border-orange-800/30' },
  'manual': { label: 'Manual', cls: 'text-zinc-400 bg-zinc-800/40 border-zinc-700' },
}

const ROCK_STATUS = {
  on_track: { label: 'On Track', cls: 'text-green-400' },
  at_risk: { label: 'At Risk', cls: 'text-amber-400' },
  off_track: { label: 'Off Track', cls: 'text-red-400' },
  complete: { label: 'Complete', cls: 'text-zinc-400' },
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="font-mono text-xs text-cult-text animate-pulse tracking-widest">LOADING...</div>
    </div>
  )
}

export function IssuesPage() {
  const { profile } = useAuth()
  const { isAdmin, isOwner } = usePermissions()
  const [issues, setIssues] = useState<Issue[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [showTriage, setShowTriage] = useState(true)
  const [expandedTriage, setExpandedTriage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('issues').select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setIssues(data || []); setLoading(false) })
  }, [profile])

  async function add() {
    if (!title.trim() || !profile) return
    const { data } = await supabase.from('issues').insert({
      title: title.trim(), reported_by: profile.id, owner_id: profile.id,
      priority: 'medium', status: 'open'
    }).select().single()
    if (data) { setIssues(p => [data, ...p]); setTitle('') }
  }

  async function resolve(id: string) {
    await supabase.from('issues').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    setIssues(p => p.map(i => i.id === id ? { ...i, status: 'resolved' as const } : i))
  }

  async function promoteTriage(id: string) {
    await supabase.from('issues').update({ status: 'open' }).eq('id', id)
    setIssues(p => p.map(i => i.id === id ? { ...i, status: 'open' as any } : i))
  }

  async function dismissTriage(id: string) {
    await supabase.from('issues').update({ status: 'dismissed' }).eq('id', id)
    setIssues(p => p.map(i => i.id === id ? { ...i, status: 'dismissed' as any } : i))
  }

  if (loading) return <Loading />
  const triage = issues.filter(i => (i as any).status === 'triage')
  const open = issues.filter(i => i.status === 'open' || i.status === 'in_discussion')
  const resolved = issues.filter(i => i.status === 'resolved')

  return (
    <div className="max-w-3xl mx-auto animate-slide-up space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">IDS Framework</div>
          <h1 className="section-title">Issues</h1>
        </div>
        <AskClaudeButton context="issues" />
      </div>

      {/* Triage Section — owner + admin only */}
      {(isOwner || isAdmin) && triage.length > 0 && (
        <div className="border border-purple-800/30 rounded-xl bg-purple-900/5 overflow-hidden">
          <button
            onClick={() => setShowTriage(!showTriage)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-900/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scan size={15} className="text-purple-400" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-purple-400 uppercase">
                Triage · {triage.length} detected
              </span>
            </div>
            {showTriage ? <ChevronUp size={14} className="text-purple-400" /> : <ChevronDown size={14} className="text-purple-400" />}
          </button>

          {showTriage && (
            <div className="border-t border-purple-800/20 px-4 py-3 space-y-2">
              <p className="font-mono text-[10px] text-cult-text mb-3">
                AI-detected from Slack. Promote to add to IDS queue, or dismiss.
              </p>
              {triage.map(issue => {
                const p = PRIORITY_CFG[(issue as any).priority] || PRIORITY_CFG.medium
                const src = SOURCE_BADGE[(issue as any).source_type] || SOURCE_BADGE.manual
                const expanded = expandedTriage === issue.id
                return (
                  <div key={issue.id} className="card border-purple-800/20 overflow-hidden">
                    <div className="p-4 flex items-start gap-4">
                      <Scan size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cult-white">{issue.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${src.cls}`}>{src.label}</span>
                          {(issue as any).source_channel && (
                            <span className="font-mono text-[10px] text-cult-text">#{(issue as any).source_channel}</span>
                          )}
                          {(issue as any).submitted_by_name && (
                            <span className="font-mono text-[10px] text-cult-text">· {(issue as any).submitted_by_name}</span>
                          )}
                        </div>
                        {expanded && (
                          <div className="mt-3 space-y-2">
                            {issue.description && <p className="text-xs text-cult-text">{issue.description}</p>}
                            {(issue as any).source_url && (
                              <a href={(issue as any).source_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors">
                                <ExternalLink size={10} /> View in Slack
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${p.cls}`}>{p.label}</span>
                        <button onClick={() => setExpandedTriage(expanded ? null : issue.id)}
                          className="p-1 rounded hover:bg-cult-muted transition-colors text-cult-text">
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button onClick={() => promoteTriage(issue.id)}
                          title="Promote to IDS queue"
                          className="p-1 rounded hover:bg-green-900/20 transition-colors text-green-400 hover:text-green-300">
                          <Check size={15} />
                        </button>
                        <button onClick={() => dismissTriage(issue.id)}
                          title="Dismiss"
                          className="p-1 rounded hover:bg-red-900/20 transition-colors text-cult-text hover:text-red-400">
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            className="input-field flex-1" placeholder="Identify an issue..." />
          <button onClick={add} className="btn-primary flex items-center gap-2"><Plus size={14} /> Add</button>
        </div>
      </div>
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-cult-text uppercase mb-3">Open · {open.length}</div>
        <div className="space-y-2">
          {open.map(issue => {
            const p = PRIORITY_CFG[issue.priority]
            const src = SOURCE_BADGE[(issue as any).source_type]
            return (
              <div key={issue.id} className="card p-4 flex items-start gap-4 group">
                <AlertCircle size={15} className="text-cult-text mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cult-white">{issue.title}</p>
                  {issue.description && <p className="text-xs text-cult-text mt-1">{issue.description}</p>}
                  {src && src.label !== 'Manual' && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${src.cls}`}>{src.label}</span>
                      {(issue as any).source_channel && (
                        <span className="font-mono text-[10px] text-cult-text">#{(issue as any).source_channel}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${p.cls}`}>{p.label}</span>
                  <button onClick={() => resolve(issue.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400 hover:text-green-300">
                    <CheckCircle2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
          {open.length === 0 && (
            <div className="card p-8 text-center">
              <AlertCircle size={24} className="text-cult-text mx-auto mb-2" />
              <p className="text-cult-text text-xs font-mono">No open issues. Good sign.</p>
            </div>
          )}
        </div>
      </div>
      {resolved.length > 0 && (
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cult-text uppercase mb-3">Resolved · {resolved.length}</div>
          <div className="space-y-2">
            {resolved.slice(0, 5).map(issue => (
              <div key={issue.id} className="card p-3 flex items-center gap-3 opacity-50">
                <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                <p className="text-xs text-cult-text line-through">{issue.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TodosPage() {
  const { profile } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('todos').select('*').eq('owner_id', profile.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTodos(data || []); setLoading(false) })
  }, [profile])

  async function add() {
    if (!title.trim() || !profile) return
    const { data } = await supabase.from('todos').insert({
      title: title.trim(), owner_id: profile.id, status: 'open'
    }).select().single()
    if (data) { setTodos(p => [data, ...p]); setTitle('') }
  }

  async function complete(id: string, current: string) {
    const next = current === 'complete' ? 'open' : 'complete'
    await supabase.from('todos').update({ status: next }).eq('id', id)
    setTodos(p => p.map(t => t.id === id ? { ...t, status: next as Todo['status'] } : t))
  }

  if (loading) return <Loading />
  const open = todos.filter(t => t.status !== 'complete')
  const done = todos.filter(t => t.status === 'complete')

  return (
    <div className="max-w-3xl mx-auto animate-slide-up space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">Weekly Commitments</div>
          <h1 className="section-title">To-Dos</h1>
        </div>
        <AskClaudeButton context="todos" />
      </div>
      <div className="card p-4">
        <div className="flex gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            className="input-field flex-1" placeholder="Add a to-do..." />
          <button onClick={add} className="btn-primary flex items-center gap-2"><Plus size={14} /> Add</button>
        </div>
      </div>
      <div className="space-y-2">
        {open.map(todo => (
          <div key={todo.id} className="card p-4 flex items-start gap-3 group">
            <button onClick={() => complete(todo.id, todo.status)} className="mt-0.5 text-cult-text hover:text-cult-gold transition-colors">
              <Circle size={15} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cult-white">{todo.title}</p>
              {todo.due_date && <p className="font-mono text-[10px] text-cult-text mt-1">Due {new Date(todo.due_date).toLocaleDateString()}</p>}
            </div>
          </div>
        ))}
        {open.length === 0 && (
          <div className="card p-8 text-center">
            <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-cult-text text-xs font-mono">All caught up.</p>
          </div>
        )}
      </div>
      {done.length > 0 && (
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cult-text uppercase mb-3">Done · {done.length}</div>
          <div className="space-y-2">
            {done.slice(0, 5).map(todo => (
              <div key={todo.id} className="card p-3 flex items-center gap-3 opacity-40 group">
                <button onClick={() => complete(todo.id, todo.status)} className="text-green-400">
                  <CheckCircle2 size={13} />
                </button>
                <p className="text-xs text-cult-text line-through">{todo.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RocksPage() {
  const { profile } = useAuth()
  const [rocks, setRocks] = useState<Rock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('rocks').select('*').eq('owner_id', profile.id).eq('quarter', 'Q1-2026')
      .order('created_at')
      .then(({ data }) => { setRocks(data || []); setLoading(false) })
  }, [profile])

  async function updateStatus(id: string, status: Rock['status']) {
    await supabase.from('rocks').update({ status }).eq('id', id)
    setRocks(p => p.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) return <Loading />
  const onTrack = rocks.filter(r => r.status === 'on_track').length
  const complete = rocks.filter(r => r.status === 'complete').length

  return (
    <div className="max-w-3xl mx-auto animate-slide-up space-y-8">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">Q1 2026 · EOS Rocks</div>
        <h1 className="section-title">Rocks & Scorecard</h1>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-cult-gold">{rocks.length}</div>
          <div className="font-mono text-[10px] text-cult-text mt-1 tracking-wider">TOTAL ROCKS</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-green-400">{onTrack}</div>
          <div className="font-mono text-[10px] text-cult-text mt-1 tracking-wider">ON TRACK</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-blue-400">{complete}</div>
          <div className="font-mono text-[10px] text-cult-text mt-1 tracking-wider">COMPLETE</div>
        </div>
      </div>
      <div className="space-y-3">
        {rocks.map(rock => {
          const s = ROCK_STATUS[rock.status]
          return (
            <div key={rock.id} className="card p-4 flex items-start gap-4">
              <Target size={15} className="text-cult-gold mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cult-white">{rock.title}</p>
                {rock.description && <p className="text-xs text-cult-text mt-1">{rock.description}</p>}
                {rock.success_metric && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <BarChart3 size={10} className="text-cult-gold/50" />
                    <span className="font-mono text-[10px] text-cult-gold/60">{rock.success_metric}</span>
                  </div>
                )}
              </div>
              <select value={rock.status} onChange={e => updateStatus(rock.id, e.target.value as Rock['status'])}
                className={`text-[10px] font-mono bg-cult-dark border border-cult-border rounded px-2 py-1 ${s.cls} focus:outline-none focus:border-cult-gold`}>
                {Object.entries(ROCK_STATUS).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>
          )
        })}
        {rocks.length === 0 && (
          <div className="card p-8 text-center">
            <TrendingUp size={24} className="text-cult-text mx-auto mb-2" />
            <p className="text-cult-text text-xs font-mono">No rocks set for Q1 2026.</p>
          </div>
        )}
      </div>
    </div>
  )
}