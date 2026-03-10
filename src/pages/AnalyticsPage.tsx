import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import {
  BarChart3, TrendingUp, Target, MessageSquare, Users,
  Star, CheckSquare, Flame, AlertCircle, Download, FileText,
  Activity,
} from 'lucide-react'
import { useAnalytics } from '../hooks/useAnalytics'
import type {
  MeetingRatingPoint, TodoCompletionPoint, RockHealthData,
  ScorecardMetricTrend, TeamProductivityPoint, IDSResolutionData, KPISummary,
} from '../hooks/useAnalytics'

// ── Theme Colors ──
const GOLD = '#C8A84B'
const GOLD_DIM = '#C8A84B80'
const GREEN = '#22C55E'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const SURFACE = '#141414'
const BORDER = '#1F1F1F'
const TEXT_DIM = '#71717A'
const WHITE = '#F5F5F5'

// ── Custom Tooltip ──
function CultTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cult-dark border border-cult-border rounded-lg px-3 py-2 shadow-xl">
      <p className="font-mono text-[10px] text-cult-text mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono text-xs" style={{ color: p.color }}>
          {p.name}: <span className="text-cult-white font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── H8: KPI Summary Card ──
function KPICards({ kpi }: { kpi: KPISummary }) {
  const cards = [
    {
      label: 'Avg Rating',
      value: kpi.avgRating?.toFixed(1) ?? '—',
      icon: Star,
      color: 'text-cult-gold',
      sub: `${kpi.meetingsHeld} meetings`,
    },
    {
      label: 'Todo Completion',
      value: `${kpi.todoCompletionRate}%`,
      icon: CheckSquare,
      color: 'text-cult-green-bright',
      sub: 'all time',
    },
    {
      label: 'Rocks On Track',
      value: `${kpi.rocksOnTrack}/${kpi.rocksTotal}`,
      icon: Target,
      color: 'text-blue-300',
      sub: `${kpi.rocksTotal > 0 ? Math.round((kpi.rocksOnTrack / kpi.rocksTotal) * 100) : 0}% healthy`,
    },
    {
      label: 'Issues Resolved',
      value: kpi.issuesResolved,
      icon: AlertCircle,
      color: 'text-cult-amber-bright',
      sub: 'total',
    },
    {
      label: 'Meeting Streak',
      value: kpi.streak,
      icon: Flame,
      color: kpi.streak >= 5 ? 'text-cult-gold' : 'text-cult-text',
      sub: 'consecutive weeks',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className="card p-4">
          <c.icon size={14} className={`${c.color} mb-2`} />
          <div className={`font-display text-2xl ${c.color} mb-0.5`}>{c.value}</div>
          <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase">{c.label}</div>
          <div className="font-mono text-[9px] text-cult-text/50 mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── H1: Meeting Ratings Chart ──
function MeetingRatingsChart({ data }: { data: MeetingRatingPoint[] }) {
  if (data.length === 0) return <EmptyChart message="No meeting ratings recorded yet" />

  return (
    <ChartCard title="Meeting Ratings Trend" icon={Star} subtitle="Last 12 rated meetings">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
              <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="label" tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <YAxis domain={[0, 10]} tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Tooltip content={<CultTooltip />} />
          <ReferenceLine y={8} stroke={GREEN} strokeDasharray="4 4" label={{ value: 'Target: 8', fill: GREEN, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          <Area type="monotone" dataKey="rating" stroke={GOLD} fill="url(#ratingGrad)" strokeWidth={2} name="Rating" dot={{ r: 4, fill: GOLD }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── H2: Todo Completion Rate ──
function TodoCompletionChart({ data }: { data: TodoCompletionPoint[] }) {
  if (data.length === 0) return <EmptyChart message="No todo data available" />

  return (
    <ChartCard title="Todo Completion Rate" icon={CheckSquare} subtitle="Weekly rolling % (12 weeks)">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="todoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
              <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="label" tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <YAxis domain={[0, 100]} tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CultTooltip />} />
          <Area type="monotone" dataKey="rate" stroke={GREEN} fill="url(#todoGrad)" strokeWidth={2} name="Completion %" dot={{ r: 3, fill: GREEN }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── H3: Rock Health Dashboard ──
function RockHealthChart({ data }: { data: RockHealthData[] }) {
  if (data.length === 0) return <EmptyChart message="No rocks data available" />

  return (
    <ChartCard title="Rock Health by Quarter" icon={Target} subtitle="On-track / off-track / complete">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="quarter" tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <YAxis tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Tooltip content={<CultTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Bar dataKey="onTrack" stackId="a" fill={GREEN} name="On Track" radius={[0, 0, 0, 0]} />
          <Bar dataKey="offTrack" stackId="a" fill={RED} name="Off Track" />
          <Bar dataKey="complete" stackId="a" fill={GOLD} name="Complete" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── H4: Scorecard Trends (sparklines per metric) ──
function ScorecardTrendsPanel({ trends }: { trends: ScorecardMetricTrend[] }) {
  if (trends.length === 0) return <EmptyChart message="No scorecard metrics tracked yet" />

  return (
    <ChartCard title="Scorecard Trends" icon={BarChart3} subtitle="Last 12 weeks per metric">
      <div className="grid grid-cols-2 gap-4">
        {trends.map(metric => (
          <div key={metric.metricId} className="bg-cult-surface rounded-lg p-3 border border-cult-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cult-white font-medium truncate">{metric.title}</span>
              {metric.unit && <span className="font-mono text-[9px] text-cult-text">{metric.unit}</span>}
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={metric.entries} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={1.5} dot={false} />
                {metric.goal != null && (
                  <ReferenceLine y={metric.goal} stroke={GREEN} strokeDasharray="2 2" />
                )}
              </LineChart>
            </ResponsiveContainer>
            {metric.entries.length > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[9px] text-cult-text/50">
                  {metric.entries[0].label}
                </span>
                <span className="font-mono text-xs text-cult-gold font-bold">
                  {metric.entries[metric.entries.length - 1]?.value ?? '—'}
                </span>
                <span className="font-mono text-[9px] text-cult-text/50">
                  {metric.entries[metric.entries.length - 1]?.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

// ── H5: Team Productivity Heatmap ──
function TeamProductivityHeatmap({ data }: { data: TeamProductivityPoint[] }) {
  if (data.length === 0) return <EmptyChart message="No team productivity data" />

  const maxVal = Math.max(...data.flatMap(d => d.completions), 1)

  function getHeatColor(val: number): string {
    if (val === 0) return 'bg-cult-muted'
    const intensity = val / maxVal
    if (intensity > 0.75) return 'bg-cult-gold'
    if (intensity > 0.5) return 'bg-cult-gold/60'
    if (intensity > 0.25) return 'bg-cult-gold/30'
    return 'bg-cult-gold/15'
  }

  return (
    <ChartCard title="Team Productivity" icon={Users} subtitle="Completions per person per week (8 weeks)">
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex items-center gap-1">
          <div className="w-28 flex-shrink-0" />
          {data[0]?.weekLabels.map((label, i) => (
            <div key={i} className="flex-1 text-center font-mono text-[8px] text-cult-text/40 truncate">
              {label}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {data.map(person => (
          <div key={person.profileId} className="flex items-center gap-1">
            <div className="w-28 flex-shrink-0 text-xs text-cult-white truncate">{person.name}</div>
            {person.completions.map((val, i) => (
              <div
                key={i}
                className={`flex-1 h-7 rounded-sm flex items-center justify-center ${getHeatColor(val)}`}
                title={`${person.name}: ${val} completions (${person.weekLabels[i]})`}
              >
                {val > 0 && <span className="font-mono text-[9px] text-cult-white/80">{val}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

// ── H6: IDS Resolution Metrics ──
function IDSResolutionChart({ data }: { data: IDSResolutionData }) {
  return (
    <ChartCard title="IDS Resolution Metrics" icon={MessageSquare} subtitle="Issue identification and resolution">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-cult-surface rounded-lg p-3 border border-cult-border text-center">
          <div className="font-display text-2xl text-cult-gold">{data.avgResolveHours}h</div>
          <div className="font-mono text-[9px] text-cult-text tracking-wider uppercase mt-1">Avg Resolve Time</div>
        </div>
        <div className="bg-cult-surface rounded-lg p-3 border border-cult-border text-center">
          <div className="font-display text-2xl text-cult-green-bright">{data.totalResolved}</div>
          <div className="font-mono text-[9px] text-cult-text tracking-wider uppercase mt-1">Total Resolved</div>
        </div>
        <div className="bg-cult-surface rounded-lg p-3 border border-cult-border text-center">
          <div className="font-display text-2xl text-cult-amber-bright">{data.totalOpen}</div>
          <div className="font-mono text-[9px] text-cult-text tracking-wider uppercase mt-1">Currently Open</div>
        </div>
      </div>

      {data.issuesPerMeeting.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.issuesPerMeeting} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="label" tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Tooltip content={<CultTooltip />} />
            <Bar dataKey="count" fill={AMBER} name="Issues" radius={[4, 4, 0, 0]}>
              {data.issuesPerMeeting.map((_, i) => (
                <Cell key={i} fill={i === data.issuesPerMeeting.length - 1 ? GOLD : AMBER + '80'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// ── H7: Export buttons ──
function ExportPanel({ onExportCSV, onExportPDF }: { onExportCSV: () => void; onExportPDF: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-cult-surface border border-cult-border rounded-lg
          text-xs font-mono text-cult-text hover:text-cult-white hover:border-cult-gold/30 transition-colors"
      >
        <Download size={13} />
        Export CSV
      </button>
      <button
        onClick={onExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-cult-surface border border-cult-border rounded-lg
          text-xs font-mono text-cult-text hover:text-cult-white hover:border-cult-gold/30 transition-colors"
      >
        <FileText size={13} />
        Export Report
      </button>
    </div>
  )
}

// ── Shared Components ──
function ChartCard({ title, icon: Icon, subtitle, children }: {
  title: string; icon: any; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-cult-gold" />
        <span className="font-mono text-xs text-cult-text tracking-wider uppercase">{title}</span>
      </div>
      {subtitle && <p className="font-mono text-[10px] text-cult-text/50 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="card p-8 flex items-center justify-center">
      <p className="font-mono text-xs text-cult-text/50">{message}</p>
    </div>
  )
}

// ── Main Page ──
export default function AnalyticsPage() {
  const {
    meetingRatings, todoCompletion, rockHealth, scorecardTrends,
    teamProductivity, idsResolution, kpiSummary, loading,
  } = useAnalytics()

  function handleExportCSV() {
    // Build CSV from meeting ratings + todo completion
    const rows = [
      ['Section', 'Date', 'Value'],
      ...meetingRatings.map(r => ['Meeting Rating', r.date, String(r.rating)]),
      ...todoCompletion.map(t => ['Todo Completion %', t.weekStart, String(t.rate)]),
      ...rockHealth.flatMap(r => [
        ['Rock On Track', r.quarter, String(r.onTrack)],
        ['Rock Off Track', r.quarter, String(r.offTrack)],
        ['Rock Complete', r.quarter, String(r.complete)],
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cult-los-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportPDF() {
    // Use browser print as PDF
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity size={20} className="text-cult-gold mx-auto mb-3 animate-pulse" />
          <div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">
            LOADING ANALYTICS...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-cult-white">ANALYTICS</h1>
          <p className="font-mono text-xs text-cult-text tracking-wider mt-1">Reporting & performance insights</p>
        </div>
        <ExportPanel onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
      </div>

      {/* H8: KPI Summary */}
      <KPICards kpi={kpiSummary} />

      {/* H1 + H2: Rating & Todo charts side by side */}
      <div className="grid grid-cols-2 gap-6">
        <MeetingRatingsChart data={meetingRatings} />
        <TodoCompletionChart data={todoCompletion} />
      </div>

      {/* H3: Rock Health */}
      <RockHealthChart data={rockHealth} />

      {/* H4: Scorecard Trends */}
      <ScorecardTrendsPanel trends={scorecardTrends} />

      {/* H5: Team Productivity Heatmap */}
      <TeamProductivityHeatmap data={teamProductivity} />

      {/* H6: IDS Resolution */}
      <IDSResolutionChart data={idsResolution} />
    </div>
  )
}
