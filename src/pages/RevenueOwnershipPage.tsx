import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  DollarSign, Target, MapPin, ClipboardList, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Circle, Package,
  Users, Calendar, ArrowUpRight, Briefcase,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { supabaseOps } from '../lib/supabase-ops'
import type { Goal, Rock, ScorecardMetric, ScorecardEntry } from '../types'

// ── Theme ──
const GOLD = '#C8A84B'
const GREEN = '#22C55E'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const BLUE = '#60A5FA'
const SURFACE = '#141414'
const BORDER = '#1F1F1F'
const TEXT_DIM = '#71717A'

// ── Tooltip ──
function CultTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg px-3 py-2 shadow-xl">
      <p className="font-mono text-[10px] text-cult-text mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono text-xs" style={{ color: p.color }}>
          {p.name}: <span className="text-cult-white font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Section Wrapper ──
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-cult-gold" />
        <h2 className="font-display text-lg tracking-wider text-cult-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Chart Card ──
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-3">
        <div className="font-mono text-xs text-cult-white tracking-wider">{title}</div>
        {subtitle && <div className="font-mono text-[9px] text-cult-text/60 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

// ── CRM Types ──
interface CRMVisit {
  id: string
  customer_id: string
  visit_date: string
  visit_type: string
  status: string
  outcome_notes: string | null
  customers?: { name: string }
}

interface CRMTask {
  id: string
  title: string
  task_type: string
  status: string
  due_date: string | null
  completed_at: string | null
  customers?: { name: string }
}

interface CRMCustomer {
  id: string
  name: string
  pipeline_stage: string
  lifetime_revenue: number | null
  last_order_date: string | null
  account_status: string
}

interface CRMOrder {
  id: string
  order_number: string
  total_amount: number
  order_date: string
  status: string
  customers?: { name: string }
}

// ── Leo's user ID in CULT-OPS ──
const LEO_OPS_USER_ID = 'a1000000-0000-0000-0000-000000000004'

export default function RevenueOwnershipPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)

  // CULT-LOS data
  const [goals, setGoals] = useState<Goal[]>([])
  const [rocks, setRocks] = useState<Rock[]>([])
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([])
  const [entries, setEntries] = useState<ScorecardEntry[]>([])

  // CULT-OPS CRM data
  const [visits, setVisits] = useState<CRMVisit[]>([])
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>([])
  const [customers, setCustomers] = useState<CRMCustomer[]>([])
  const [orders, setOrders] = useState<CRMOrder[]>([])
  const [opsConnected, setOpsConnected] = useState(false)

  useEffect(() => {
    if (profile) fetchAll()
  }, [profile])

  async function fetchAll() {
    if (!profile) return
    setLoading(true)

    // ── Fetch CULT-LOS data ──
    const [goalsRes, rocksRes, metricsRes] = await Promise.all([
      supabase.from('goals').select('*').eq('profile_id', profile.id).order('phase').order('created_at'),
      supabase.from('rocks').select('*, profiles(id, full_name, avatar_url)').eq('owner_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('scorecard_metrics').select('*').eq('owner_id', profile.id).eq('is_active', true),
    ])

    setGoals(goalsRes.data || [])
    setRocks(rocksRes.data || [])
    setMetrics(metricsRes.data || [])

    // Fetch scorecard entries for active metrics
    if (metricsRes.data && metricsRes.data.length > 0) {
      const metricIds = metricsRes.data.map(m => m.id)
      const { data: entryData } = await supabase
        .from('scorecard_entries')
        .select('*')
        .in('metric_id', metricIds)
        .order('week_start', { ascending: true })
      setEntries(entryData || [])
    }

    // ── Fetch CULT-OPS CRM data ──
    if (supabaseOps) {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const isoThirty = thirtyDaysAgo.toISOString().split('T')[0]

        const [visitsRes, tasksRes, customersRes, ordersRes] = await Promise.all([
          supabaseOps.from('crm_visit_schedule').select('*, customers(name)').eq('user_id', LEO_OPS_USER_ID).gte('visit_date', isoThirty).order('visit_date', { ascending: false }).limit(50),
          supabaseOps.from('crm_tasks').select('*, customers(name)').eq('assigned_user_id', LEO_OPS_USER_ID).order('created_at', { ascending: false }).limit(30),
          supabaseOps.from('customers').select('*').order('lifetime_revenue', { ascending: false }).limit(20),
          supabaseOps.from('orders').select('*, customers(name)').eq('test_mode', false).gte('order_date', isoThirty).order('order_date', { ascending: false }).limit(20),
        ])

        setVisits(visitsRes.data || [])
        setCrmTasks(tasksRes.data || [])
        setCustomers(customersRes.data || [])
        setOrders(ordersRes.data || [])
        setOpsConnected(true)
      } catch {
        setOpsConnected(false)
      }
    }

    setLoading(false)
  }

  // ── Computed values ──
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const totalGoals = goals.length
  const goalPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  const rocksOnTrack = rocks.filter(r => r.status === 'on_track').length
  const rocksComplete = rocks.filter(r => r.status === 'complete').length

  // CRM computed
  const visitsCompleted = visits.filter(v => v.status === 'completed').length
  const visitsScheduled = visits.filter(v => v.status === 'scheduled').length
  const tasksOpen = crmTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const tasksDone = crmTasks.filter(t => t.status === 'completed').length
  const mtdRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const activeAccounts = customers.filter(c => c.account_status === 'active').length

  // Build scorecard chart data
  const scorecardChartData = metrics.map(m => {
    const metricEntries = entries.filter(e => e.metric_id === m.id).slice(-8)
    return { metric: m, data: metricEntries }
  })

  // Visit activity by week (last 4 weeks)
  const visitsByWeek = (() => {
    const weeks: { label: string; completed: number; scheduled: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const weekStart = new Date(d)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const ws = weekStart.toISOString().split('T')[0]
      const we = weekEnd.toISOString().split('T')[0]
      const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      const completed = visits.filter(v => v.visit_date >= ws && v.visit_date <= we && v.status === 'completed').length
      const scheduled = visits.filter(v => v.visit_date >= ws && v.visit_date <= we && v.status === 'scheduled').length
      weeks.push({ label, completed, scheduled })
    }
    return weeks
  })()

  // Pipeline breakdown
  const pipelineData = (() => {
    const stages: Record<string, number> = {}
    customers.forEach(c => {
      const stage = c.pipeline_stage || 'Unknown'
      stages[stage] = (stages[stage] || 0) + 1
    })
    return Object.entries(stages).map(([stage, count]) => ({
      stage: stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }))
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* ── Header ── */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">
          Revenue Ownership · {profile?.full_name}
        </div>
        <h1 className="section-title mb-2">Revenue Ownership Dashboard</h1>
        <p className="text-sm text-cult-text leading-relaxed max-w-2xl">
          Track the four pillars: know where sales are, project monthly goals, push on targets, and actively use CRM.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard icon={Target} label="Goal Progress" value={`${goalPct}%`} sub={`${completedGoals}/${totalGoals} goals`} color="text-cult-gold" />
        <KPICard icon={TrendingUp} label="Rocks On Track" value={`${rocksOnTrack}`} sub={`${rocksComplete} complete`} color="text-blue-300" />
        <KPICard icon={DollarSign} label="MTD Revenue" value={`$${(mtdRevenue / 1000).toFixed(1)}k`} sub="last 30 days" color="text-cult-green-bright" />
        <KPICard icon={MapPin} label="Visits" value={`${visitsCompleted}`} sub={`${visitsScheduled} upcoming`} color="text-cult-amber-bright" />
        <KPICard icon={ClipboardList} label="CRM Tasks" value={`${tasksDone}`} sub={`${tasksOpen} open`} color="text-purple-300" />
        <KPICard icon={Users} label="Active Accounts" value={`${activeAccounts}`} sub={`${customers.length} total`} color="text-cyan-300" />
      </div>

      {/* ── 90-Day Plan Progress ── */}
      <Section title="90-Day Plan Progress" icon={Target}>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-cult-text tracking-wider">Overall Completion</span>
            <span className="font-display text-2xl text-cult-gold">{goalPct}%</span>
          </div>
          <div className="h-3 bg-cult-muted rounded-full overflow-hidden mb-6">
            <div className="h-full bg-cult-gold rounded-full transition-all duration-700" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { phase: 1, label: 'Days 1–30 · Foundation', color: 'cult-gold' },
              { phase: 2, label: 'Days 31–60 · Growth', color: 'blue-300' },
              { phase: 3, label: 'Days 61–90 · Ownership', color: 'purple-300' },
            ].map(p => {
              const phaseGoals = goals.filter(g => g.phase === p.phase)
              const done = phaseGoals.filter(g => g.status === 'completed').length
              const pct = phaseGoals.length > 0 ? Math.round((done / phaseGoals.length) * 100) : 0
              return (
                <div key={p.phase} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${p.color}`} />
                    <span className="font-mono text-[10px] text-cult-text tracking-wider uppercase">{p.label}</span>
                  </div>
                  <div className="h-1.5 bg-cult-muted rounded-full overflow-hidden">
                    <div className={`h-full bg-${p.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-cult-text">{done}/{phaseGoals.length}</span>
                    <span className={`font-mono text-[10px] text-${p.color}`}>{pct}%</span>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {phaseGoals.map(g => (
                      <GoalRow key={g.id} goal={g} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ── Rocks ── */}
      <Section title="Q2 Rocks" icon={Briefcase}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rocks.length === 0 && (
            <div className="card p-6 col-span-2 text-center">
              <p className="font-mono text-xs text-cult-text">No rocks assigned yet.</p>
            </div>
          )}
          {rocks.map(rock => (
            <div key={rock.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-cult-white leading-snug">{rock.title}</p>
                  {rock.success_metric && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-cult-gold/50" />
                      <span className="font-mono text-[10px] text-cult-gold/70">{rock.success_metric}</span>
                    </div>
                  )}
                </div>
                <RockStatusBadge status={rock.status} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Scorecard Trends ── */}
      <Section title="Scorecard Metrics" icon={TrendingUp}>
        {scorecardChartData.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-mono text-xs text-cult-text">No scorecard metrics tracked yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scorecardChartData.map(({ metric, data }) => (
              <ChartCard key={metric.id} title={metric.title} subtitle={`Goal: ${metric.goal_value ?? '—'} ${metric.unit ?? ''} · ${metric.frequency}`}>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="week_start" tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip content={<CultTooltip />} />
                      <Area type="monotone" dataKey="value" stroke={GOLD} fill={`url(#grad-${metric.id})`} strokeWidth={2} name="Value" dot={{ r: 3, fill: GOLD }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[160px] flex items-center justify-center">
                    <span className="font-mono text-[10px] text-cult-text">No entries yet</span>
                  </div>
                )}
              </ChartCard>
            ))}
          </div>
        )}
      </Section>

      {/* ── CRM Performance ── */}
      <Section title="CRM Performance" icon={MapPin}>
        {!opsConnected ? (
          <div className="card p-6 text-center border-dashed border-cult-border">
            <MapPin size={24} className="text-cult-text mx-auto mb-3" />
            <p className="font-mono text-xs text-cult-text mb-1">CRM data not connected</p>
            <p className="font-mono text-[10px] text-cult-text/50">Set VITE_CULTOPS_SUPABASE_URL and VITE_CULTOPS_SUPABASE_ANON_KEY to enable.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visit Activity Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Visit Activity" subtitle="Last 4 weeks">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={visitsByWeek} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="label" tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip content={<CultTooltip />} />
                    <Bar dataKey="completed" name="Completed" fill={GREEN} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="scheduled" name="Scheduled" fill={AMBER} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Pipeline Breakdown" subtitle="Accounts by stage">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={pipelineData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis type="number" tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis type="category" dataKey="stage" tick={{ fill: TEXT_DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} width={90} />
                    <Tooltip content={<CultTooltip />} />
                    <Bar dataKey="count" name="Accounts" fill={GOLD} radius={[0, 3, 3, 0]}>
                      {pipelineData.map((_, i) => (
                        <Cell key={i} fill={[GOLD, GREEN, BLUE, AMBER, RED][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Recent Orders */}
            <ChartCard title="Recent Orders" subtitle="Last 30 days">
              {orders.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="font-mono text-[10px] text-cult-text">No orders in the last 30 days</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {orders.slice(0, 10).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-cult-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <Package size={13} className="text-cult-gold flex-shrink-0" />
                        <div>
                          <span className="text-xs text-cult-white">{o.customers?.name ?? `Order #${o.order_number}`}</span>
                          <div className="font-mono text-[9px] text-cult-text">{new Date(o.order_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-sm text-cult-green-bright">${o.total_amount?.toLocaleString()}</span>
                        <div className="font-mono text-[9px] text-cult-text">{o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Recent Visits */}
            <ChartCard title="Recent Visit Log" subtitle="Last 30 days">
              {visits.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="font-mono text-[10px] text-cult-text">No visits logged</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {visits.slice(0, 10).map(v => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-cult-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <MapPin size={13} className={v.status === 'completed' ? 'text-cult-green-bright' : 'text-cult-amber-bright'} />
                        <div>
                          <span className="text-xs text-cult-white">{v.customers?.name ?? 'Unknown'}</span>
                          <div className="font-mono text-[9px] text-cult-text">{v.visit_type?.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-cult-text">{new Date(v.visit_date).toLocaleDateString()}</span>
                        <div className={`font-mono text-[9px] ${v.status === 'completed' ? 'text-cult-green-bright' : 'text-cult-amber-bright'}`}>
                          {v.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Sub-components ──

function KPICard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card p-4">
      <Icon size={14} className={`${color} mb-2`} />
      <div className={`font-display text-2xl ${color} mb-0.5`}>{value}</div>
      <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase">{label}</div>
      <div className="font-mono text-[9px] text-cult-text/50 mt-0.5">{sub}</div>
    </div>
  )
}

function GoalRow({ goal }: { goal: Goal }) {
  const cfg: Record<string, { icon: any; cls: string }> = {
    not_started: { icon: Circle, cls: 'text-cult-text' },
    in_progress: { icon: Clock, cls: 'text-cult-amber-bright' },
    completed: { icon: CheckCircle2, cls: 'text-cult-green-bright' },
    at_risk: { icon: AlertTriangle, cls: 'text-cult-red-bright' },
  }
  const s = cfg[goal.status] || cfg.not_started
  const StatusIcon = s.icon
  return (
    <div className="flex items-start gap-2 py-1">
      <StatusIcon size={12} className={`${s.cls} mt-0.5 flex-shrink-0`} />
      <span className={`text-xs leading-snug ${goal.status === 'completed' ? 'line-through text-cult-text' : 'text-cult-white'}`}>
        {goal.title}
      </span>
    </div>
  )
}

function RockStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    on_track: { bg: 'bg-green-500/10', text: 'text-cult-green-bright', label: 'On Track' },
    off_track: { bg: 'bg-red-500/10', text: 'text-cult-red-bright', label: 'Off Track' },
    complete: { bg: 'bg-cult-gold/10', text: 'text-cult-gold', label: 'Complete' },
  }
  const s = cfg[status] || cfg.on_track
  return (
    <span className={`${s.bg} ${s.text} font-mono text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap`}>
      {s.label}
    </span>
  )
}
