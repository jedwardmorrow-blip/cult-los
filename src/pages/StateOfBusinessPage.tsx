import { useEffect, useState } from 'react'
import {
  BarChart2, Users, AlertCircle, Target, CheckSquare,
  Gauge, Shield, Activity, TrendingUp, TrendingDown, Zap,
  Clock, Flame, Activity as ActivityIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'

// ── Color Palette ──
const GREEN = '#22C55E'
const RED = '#EF4444'
const AMBER = '#F59E0B'
const GOLD = '#C8A84B'

// ── Types ──
interface TeamMember {
  id: string
  full_name: string
  role: string
  scorecard_count: number
  metrics_on_track: number
  rocks_on_track: number
  rocks_total: number
  todos_open: number
  oldest_todo_days: number | null
  health: 'green' | 'amber' | 'red'
}

interface DepartmentStats {
  name: string
  owner_name: string | null
  key_metrics: Array<{ name: string; value: number; goal: number }>
  rocks_on_track: number
  rocks_total: number
  issues_open: number
}

interface IssueFlowData {
  triage: number
  open: number
  discussing: number
  resolved: number
  total: number
  source_breakdown: Record<string, number>
}

interface ScorecardEntry {
  metric_id: string
  metric_title: string
  owner_name: string
  goal_value: number
  values: (number | null)[]
  weeks: string[]
}

interface ScorecardMetric {
  metric_id: string
  metric_title: string
  owner_name: string
  goal_value: number
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

// ── Panel 1: Team Pulse ──
function TeamPulsePanel({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="bg-cult-dark border border-cult-border rounded-lg p-8 text-center">
        <Users size={24} className="text-cult-text mx-auto mb-3" />
        <p className="font-mono text-xs text-cult-text">No team data available</p>
      </div>
    )
  }

  function getHealthColor(health: string): string {
    return health === 'green' ? 'bg-green-400/10 border-green-400/30'
      : health === 'amber' ? 'bg-amber-400/10 border-amber-400/30'
      : 'bg-red-400/10 border-red-400/30'
  }

  function getHealthDot(health: string): string {
    return health === 'green' ? 'bg-green-400'
      : health === 'amber' ? 'bg-amber-400'
      : 'bg-red-400'
  }

  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-cult-border">
        <div className="flex items-center gap-2 mb-0.5">
          <Users size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Team Pulse</span>
        </div>
        <p className="font-mono text-[10px] text-cult-text/50 mt-1">Health snapshot per team member</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {members.map(m => (
          <div key={m.id} className={`rounded-lg p-3 border ${getHealthColor(m.health)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-medium text-xs text-cult-white">{m.full_name}</div>
                <div className="font-mono text-[10px] text-cult-text">{m.role}</div>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${getHealthDot(m.health)}`} />
            </div>

            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Scorecard:</span>
                <span className="text-cult-white">
                  {m.metrics_on_track}/{m.scorecard_count}
                  <span className="text-cult-text"> on track</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Rocks:</span>
                <span className="text-cult-white">
                  {m.rocks_on_track}/{m.rocks_total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Todos:</span>
                <span className="text-cult-white">
                  {m.todos_open} open
                  {m.oldest_todo_days && m.oldest_todo_days > 0 && (
                    <span className="text-amber-400"> • {m.oldest_todo_days}d old</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Panel 2: Department Health ──
function DepartmentHealthPanel({ departments }: { departments: DepartmentStats[] }) {
  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-cult-border">
        <div className="flex items-center gap-2 mb-0.5">
          <BarChart2 size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Department Health</span>
        </div>
        <p className="font-mono text-[10px] text-cult-text/50 mt-1">Key metrics, rocks, and issues by department</p>
      </div>

      <div className="divide-y divide-cult-border">
        {departments.map(dept => {
          const rocksHealthPct = dept.rocks_total > 0 ? Math.round((dept.rocks_on_track / dept.rocks_total) * 100) : 0
          return (
            <div key={dept.name} className="px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-sm text-cult-white">{dept.name}</div>
                  {dept.owner_name && <div className="font-mono text-[10px] text-cult-text">{dept.owner_name}</div>}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-cult-text">Issues:</span>
                    <span className={`font-mono font-bold ${dept.issues_open > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {dept.issues_open}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-3 space-y-1.5 text-[10px]">
                {dept.key_metrics.map(metric => {
                  const health = metric.value >= metric.goal ? 'green' : 'red'
                  return (
                    <div key={metric.name} className="flex items-center justify-between">
                      <span className="text-cult-text max-w-xs truncate">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cult-white w-16 text-right">{metric.value}</span>
                        <div className={`w-1 h-1 rounded-full ${health === 'green' ? 'bg-green-400' : 'bg-red-400'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cult-text">Rock Progress</span>
                  <span className="font-mono text-cult-gold">{rocksHealthPct}%</span>
                </div>
                <div className="h-1.5 bg-cult-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cult-gold rounded-full transition-all"
                    style={{ width: `${rocksHealthPct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Panel 3: Issue Flow ──
function IssueFlowPanel({ data }: { data: IssueFlowData }) {
  const statuses = [
    { label: 'Triage', value: data.triage, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { label: 'Open', value: data.open, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    { label: 'Discussing', value: data.discussing, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { label: 'Resolved', value: data.resolved, color: 'text-green-400', bgColor: 'bg-green-400/10' },
  ]

  const maxValue = Math.max(...statuses.map(s => s.value), 1)

  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-cult-border">
        <div className="flex items-center gap-2 mb-0.5">
          <AlertCircle size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Issue Flow</span>
        </div>
        <p className="font-mono text-[10px] text-cult-text/50 mt-1">Total volume: {data.total} issues</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {statuses.map(s => (
            <div key={s.label} className={`${s.bgColor} border border-current/30 rounded-lg p-3 text-center`}>
              <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
              <div className="font-mono text-[10px] text-cult-text mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {statuses.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-cult-text w-20">{s.label}</span>
              <div className="flex-1 h-2 bg-cult-muted rounded-full overflow-hidden">
                <div
                  className={s.color.replace('text-', 'bg-')}
                  style={{ width: `${(s.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-cult-text w-10 text-right">
                {Math.round((s.value / data.total) * 100)}%
              </span>
            </div>
          ))}
        </div>

        {Object.keys(data.source_breakdown).length > 0 && (
          <div className="pt-2 border-t border-cult-border/50">
            <div className="font-mono text-[10px] text-cult-text uppercase mb-2">Source Breakdown</div>
            <div className="space-y-1 text-[10px]">
              {Object.entries(data.source_breakdown).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-cult-text capitalize">{source}</span>
                  <span className="font-mono text-cult-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Panel 4: Scorecard Grid ──
function ScorecardGridPanel({ entries }: { entries: ScorecardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-cult-dark border border-cult-border rounded-lg p-8 text-center">
        <Target size={24} className="text-cult-text mx-auto mb-3" />
        <p className="font-mono text-xs text-cult-text">No scorecard entries this week</p>
      </div>
    )
  }

  const allWeeks = Array.from(new Set(entries.flatMap(e => e.weeks)))
  const lastWeeks = allWeeks.slice(-4)

  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg overflow-auto">
      <div className="px-4 py-3 border-b border-cult-border sticky top-0 z-10 bg-cult-dark">
        <div className="flex items-center gap-2 mb-0.5">
          <Target size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Scorecard Matrix</span>
        </div>
        <p className="font-mono text-[10px] text-cult-text/50 mt-1">Last 4 weeks · Green = on track, Red = miss, Grey = no entry</p>
      </div>

      <div className="divide-y divide-cult-border">
        {entries.map(entry => {
          const recentValues = entry.values.slice(-4)
          const recentWeeks = entry.weeks.slice(-4)

          return (
            <div key={entry.metric_id} className="px-4 py-3 flex items-center gap-4 hover:bg-cult-muted/30 transition-colors">
              <div className="w-48 flex-shrink-0">
                <div className="font-mono text-xs text-cult-white truncate">{entry.metric_title}</div>
                <div className="font-mono text-[10px] text-cult-text">{entry.owner_name} • Goal: {entry.goal_value}</div>
              </div>

              <div className="flex items-center gap-2 flex-1">
                {recentValues.map((val, i) => {
                  let cellColor = 'bg-cult-muted'
                  if (val !== null && val !== undefined) {
                    cellColor = val >= entry.goal_value ? 'bg-green-500' : 'bg-red-500'
                  }

                  return (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded flex items-center justify-center ${cellColor} hover:opacity-80 transition-opacity cursor-default`}
                      title={`${recentWeeks[i]}: ${val !== null ? val : 'N/A'}`}
                    >
                      {val !== null && val !== undefined && (
                        <span className="font-mono text-[9px] text-white font-bold">{val}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Panel 5: Justin Shield (Resolution Metrics) ──
function JustinShieldPanel({ resolutionRate, resolvedCount, escalatedCount }: {
  resolutionRate: number; resolvedCount: number; escalatedCount: number
}) {
  const total = resolvedCount + escalatedCount
  const escPct = total > 0 ? Math.round((escalatedCount / total) * 100) : 0
  const freePct = 100 - escPct

  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-cult-border">
        <div className="flex items-center gap-2 mb-0.5">
          <Shield size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Justin Shield</span>
        </div>
        <p className="font-mono text-[10px] text-cult-text/50 mt-1">Issue resolution & escalation tracking</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} color="text-green-400" />
          <StatCard label="Resolved at L10" value={resolvedCount} icon={CheckSquare} color="text-cult-gold" />
          <StatCard label="Escalated to Justin" value={escalatedCount} icon={Zap} color="text-orange-400" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-cult-text uppercase">CEO Freedom Score</span>
              <span className="font-mono text-xs text-cult-gold font-bold">{freePct}%</span>
            </div>
            <div className="h-3 bg-cult-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-green-400 rounded-full transition-all"
                style={{
                  width: `${freePct}%`,
                  background: freePct >= 70 ? '#22C55E' : freePct >= 40 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="text-cult-text">Low escalations</span>
              <span className="text-cult-text">High escalations</span>
            </div>
          </div>

          <div className="pt-3 border-t border-cult-border/50">
            <div className="text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Issues handled by team</span>
                <span className="font-mono text-cult-white">{resolvedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Issues escalated to Justin</span>
                <span className="font-mono text-cult-white">{escalatedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cult-text">Total issues tracked</span>
                <span className="font-mono text-cult-gold font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export default function StateOfBusinessPage() {
  const { profile } = useAuth()
  const { isAdmin, isOwner } = usePermissions()

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [departments, setDepartments] = useState<DepartmentStats[]>([])
  const [issueFlow, setIssueFlow] = useState<IssueFlowData>({
    triage: 0, open: 0, discussing: 0, resolved: 0, total: 0, source_breakdown: {}
  })
  const [scorecardEntries, setScorecardEntries] = useState<ScorecardEntry[]>([])
  const [resolutionMetrics, setResolutionMetrics] = useState({
    rate: 0, resolved: 0, escalated: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Load profiles with scorecard health
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name')

        if (profilesData) {
          // Build team members with scorecard/rock stats
          const memberPromises = profilesData.map(async (p) => {
            // Get scorecard entries for this week
            const { data: metricEntries } = await supabase
              .from('scorecard_entries')
              .select('*, scorecard_metrics(goal_value)')
              .eq('owner_id', p.id)
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

            // Get rocks
            const { data: rocksData } = await supabase
              .from('rocks')
              .select('*')
              .eq('owner_id', p.id)
              .eq('quarter', 'Q2-2026')

            // Get todos
            const { data: todosData } = await supabase
              .from('todos')
              .select('created_at')
              .eq('owner_id', p.id)
              .is('completed_at', null)
              .order('created_at', { ascending: true })

            const onTrack = metricEntries?.filter(e => {
              const goal = (e.scorecard_metrics as any)?.goal_value
              return e.value >= (goal ?? 0)
            }).length ?? 0

            const rocksOnTrack = rocksData?.filter(r => r.status === 'on_track').length ?? 0
            const rocksTotal = rocksData?.length ?? 0

            const todosOpen = todosData?.length ?? 0
            let oldestTodoDays = null
            if (todosData?.length ?? 0 > 0) {
              const oldest = new Date(todosData![0].created_at)
              oldestTodoDays = Math.floor((Date.now() - oldest.getTime()) / (24 * 60 * 60 * 1000))
            }

            const scorecardCount = metricEntries?.length ?? 0
            const healthScore = scorecardCount > 0 ? (onTrack / scorecardCount) : 1
            const rocksHealth = rocksTotal > 0 ? (rocksOnTrack / rocksTotal) : 1
            const todosHealth = todosOpen === 0 ? 1 : Math.max(0, 1 - (oldestTodoDays || 0) / 30)
            const compositeHealth = (healthScore + rocksHealth + todosHealth) / 3

            let health: 'green' | 'amber' | 'red' = 'green'
            if (compositeHealth < 0.5) health = 'red'
            else if (compositeHealth < 0.8) health = 'amber'

            return {
              id: p.id,
              full_name: p.full_name,
              role: p.role || 'Member',
              scorecard_count: scorecardCount,
              metrics_on_track: onTrack,
              rocks_on_track: rocksOnTrack,
              rocks_total: rocksTotal,
              todos_open: todosOpen,
              oldest_todo_days: oldestTodoDays,
              health,
            }
          })

          const members = await Promise.all(memberPromises)
          setTeamMembers(members)
        }

        // 2. Load department health (hardcoded departments for now)
        const deptOwners = [
          { name: 'Cultivation', id: 'a1000000' + '0'.repeat(7) + '005' },
          { name: 'Sales', id: 'a1000000' + '0'.repeat(7) + '004' },
        ]

        const deptPromises = deptOwners.map(async (dept) => {
          // Get owner name
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', dept.id)
            .single()

          // Get recent metrics for this department
          const { data: metricsData } = await supabase
            .from('scorecard_entries')
            .select('*, scorecard_metrics(title, goal_value)')
            .eq('owner_id', dept.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(5)

          // Get rocks
          const { data: rocksData } = await supabase
            .from('rocks')
            .select('*')
            .eq('owner_id', dept.id)
            .eq('quarter', 'Q2-2026')

          // Get issues
          const { data: issuesData } = await supabase
            .from('issues')
            .select('*')
            .neq('status', 'resolved')

          const keyMetrics = (metricsData || []).slice(0, 3).map(e => ({
            name: (e.scorecard_metrics as any)?.title || 'Metric',
            value: e.value,
            goal: (e.scorecard_metrics as any)?.goal_value || 0,
          }))

          return {
            name: dept.name,
            owner_name: ownerData?.full_name || null,
            key_metrics: keyMetrics,
            rocks_on_track: rocksData?.filter(r => r.status === 'on_track').length ?? 0,
            rocks_total: rocksData?.length ?? 0,
            issues_open: issuesData?.length ?? 0,
          }
        })

        const deptResults = await Promise.all(deptPromises)
        setDepartments(deptResults)

        // 3. Load issue flow
        const { data: allIssues } = await supabase
          .from('issues')
          .select('status, source_type')

        const flowData: IssueFlowData = {
          triage: 0, open: 0, discussing: 0, resolved: 0, total: 0, source_breakdown: {}
        }

        if (allIssues) {
          flowData.total = allIssues.length
          allIssues.forEach(issue => {
            if (issue.status === 'triage') flowData.triage++
            else if (issue.status === 'open') flowData.open++
            else if (issue.status === 'in_discussion') flowData.discussing++
            else if (issue.status === 'resolved') flowData.resolved++

            const source = issue.source_type || 'manual'
            flowData.source_breakdown[source] = (flowData.source_breakdown[source] || 0) + 1
          })
        }
        setIssueFlow(flowData)

        // 4. Load scorecard grid
        const { data: allMetrics } = await supabase
          .from('scorecard_metrics')
          .select('id, title, goal_value, owner_id')

        const metricsMap = new Map()
        if (allMetrics) {
          for (const metric of allMetrics) {
            // Get owner name
            const { data: ownerData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', metric.owner_id)
              .single()

            // Get last 4 weeks of entries
            const { data: entriesData } = await supabase
              .from('scorecard_entries')
              .select('value, created_at')
              .eq('metric_id', metric.id)
              .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
              .order('created_at', { ascending: true })

            if ((entriesData?.length ?? 0) > 0) {
              const values = entriesData!.map(e => e.value)
              const weeks = entriesData!.map(e =>
                new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              )

              metricsMap.set(metric.id, {
                metric_id: metric.id,
                metric_title: metric.title,
                owner_name: ownerData?.full_name || 'Unknown',
                goal_value: metric.goal_value,
                values,
                weeks,
              })
            }
          }
        }
        setScorecardEntries(Array.from(metricsMap.values()))

        // 5. Load Justin Shield metrics (simple approach)
        const { data: justinIssues } = await supabase
          .from('issues')
          .select('status, submitted_by_name')

        let resolved = 0
        let escalated = 0
        if (justinIssues) {
          resolved = justinIssues.filter(i => i.status === 'resolved').length
          escalated = justinIssues.filter(i => i.submitted_by_name === 'Justin').length
        }

        const total = resolved + escalated
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0

        setResolutionMetrics({ rate, resolved, escalated })
      } catch (err) {
        console.error('Error loading state of business data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Access control
  if (!isAdmin && !isOwner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield size={32} className="text-cult-text mx-auto mb-4" />
          <p className="font-mono text-sm text-cult-text">Admin access required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ActivityIcon size={20} className="text-cult-gold mx-auto mb-3 animate-pulse" />
          <div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">
            LOADING STATE OF BUSINESS...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-cult-white">STATE OF BUSINESS</h1>
          <p className="font-mono text-xs text-cult-text tracking-wider mt-1">Full organizational health snapshot</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cult-gold/10 border border-cult-gold/30">
          <Gauge size={14} className="text-cult-gold" />
          <span className="font-mono text-xs text-cult-gold">Admin View</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <span className="font-mono text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Panel 1: Team Pulse */}
      <TeamPulsePanel members={teamMembers} />

      {/* Panel 2: Department Health */}
      <DepartmentHealthPanel departments={departments} />

      {/* Panel 3: Issue Flow */}
      <IssueFlowPanel data={issueFlow} />

      {/* Panel 4: Scorecard Grid */}
      <ScorecardGridPanel entries={scorecardEntries} />

      {/* Panel 5: Justin Shield */}
      <JustinShieldPanel
        resolutionRate={resolutionMetrics.rate}
        resolvedCount={resolutionMetrics.resolved}
        escalatedCount={resolutionMetrics.escalated}
      />
    </div>
  )
}
