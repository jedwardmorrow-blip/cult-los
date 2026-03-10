import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { format, subWeeks, startOfWeek, parseISO } from 'date-fns'

// ── Types ──

export interface MeetingRatingPoint {
  date: string
  label: string
  rating: number
}

export interface TodoCompletionPoint {
  weekStart: string
  label: string
  rate: number // 0-100
  completed: number
  total: number
}

export interface RockHealthData {
  quarter: string
  onTrack: number
  offTrack: number
  complete: number
}

export interface ScorecardTrendPoint {
  weekStart: string
  label: string
  value: number
  goal?: number
}

export interface ScorecardMetricTrend {
  metricId: string
  title: string
  unit?: string
  goal?: number
  entries: ScorecardTrendPoint[]
}

export interface TeamProductivityPoint {
  name: string
  profileId: string
  completions: number[]  // per-week counts
  weekLabels: string[]
}

export interface IDSResolutionData {
  avgResolveHours: number
  issuesPerMeeting: { label: string; count: number }[]
  totalResolved: number
  totalOpen: number
}

export interface KPISummary {
  avgRating: number | null
  todoCompletionRate: number
  rocksOnTrack: number
  rocksTotal: number
  issuesResolved: number
  meetingsHeld: number
  streak: number
}

export interface AnalyticsData {
  meetingRatings: MeetingRatingPoint[]
  todoCompletion: TodoCompletionPoint[]
  rockHealth: RockHealthData[]
  scorecardTrends: ScorecardMetricTrend[]
  teamProductivity: TeamProductivityPoint[]
  idsResolution: IDSResolutionData
  kpiSummary: KPISummary
  loading: boolean
}

export function useAnalytics(): AnalyticsData {
  const { profile } = useAuth()
  const [meetingRatings, setMeetingRatings] = useState<MeetingRatingPoint[]>([])
  const [todoCompletion, setTodoCompletion] = useState<TodoCompletionPoint[]>([])
  const [rockHealth, setRockHealth] = useState<RockHealthData[]>([])
  const [scorecardTrends, setScorecardTrends] = useState<ScorecardMetricTrend[]>([])
  const [teamProductivity, setTeamProductivity] = useState<TeamProductivityPoint[]>([])
  const [idsResolution, setIdsResolution] = useState<IDSResolutionData>({
    avgResolveHours: 0,
    issuesPerMeeting: [],
    totalResolved: 0,
    totalOpen: 0,
  })
  const [kpiSummary, setKpiSummary] = useState<KPISummary>({
    avgRating: null,
    todoCompletionRate: 0,
    rocksOnTrack: 0,
    rocksTotal: 0,
    issuesResolved: 0,
    meetingsHeld: 0,
    streak: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadAll()
  }, [profile])

  async function loadAll() {
    if (!profile) return
    setLoading(true)

    // Get user's room IDs
    const { data: memberData } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('profile_id', profile.id)

    const roomIds = memberData?.map(m => m.room_id) || []

    await Promise.all([
      loadMeetingRatings(roomIds),
      loadTodoCompletion(),
      loadRockHealth(),
      loadScorecardTrends(roomIds),
      loadTeamProductivity(roomIds),
      loadIDSResolution(roomIds),
      loadKPISummary(roomIds),
    ])

    setLoading(false)
  }

  // H1: Meeting ratings trend (last 12 meetings)
  async function loadMeetingRatings(roomIds: string[]) {
    if (roomIds.length === 0) return

    const { data } = await supabase
      .from('meeting_sessions')
      .select('meeting_date, rating')
      .in('room_id', roomIds)
      .not('rating', 'is', null)
      .order('meeting_date', { ascending: true })
      .limit(12)

    if (data) {
      setMeetingRatings(data.map(s => ({
        date: s.meeting_date,
        label: format(parseISO(s.meeting_date), 'MMM d'),
        rating: s.rating!,
      })))
    }
  }

  // H2: Todo completion rate over time (last 12 weeks)
  async function loadTodoCompletion() {
    const weeks: TodoCompletionPoint[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
      const weekEnd = startOfWeek(subWeeks(now, i - 1), { weekStartsOn: 1 })
      const wsStr = format(weekStart, 'yyyy-MM-dd')
      const weStr = format(weekEnd, 'yyyy-MM-dd')

      // Count todos completed that week
      const { count: completed } = await supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', wsStr)
        .lt('completed_at', weStr)
        .eq('status', 'complete')

      // Count todos that were open or completed that week
      const { count: total } = await supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', weStr)

      const comp = completed ?? 0
      const tot = total ?? 1

      weeks.push({
        weekStart: wsStr,
        label: format(weekStart, 'MMM d'),
        rate: tot > 0 ? Math.round((comp / Math.max(tot, 1)) * 100) : 0,
        completed: comp,
        total: tot,
      })
    }

    setTodoCompletion(weeks)
  }

  // H3: Rock health per quarter
  async function loadRockHealth() {
    const { data } = await supabase
      .from('rocks')
      .select('quarter, status')

    if (data) {
      const quarters = new Map<string, RockHealthData>()
      data.forEach(r => {
        if (!quarters.has(r.quarter)) {
          quarters.set(r.quarter, { quarter: r.quarter, onTrack: 0, offTrack: 0, complete: 0 })
        }
        const q = quarters.get(r.quarter)!
        if (r.status === 'on_track') q.onTrack++
        else if (r.status === 'off_track') q.offTrack++
        else if (r.status === 'complete') q.complete++
      })
      setRockHealth(Array.from(quarters.values()).sort((a, b) => a.quarter.localeCompare(b.quarter)))
    }
  }

  // H4: Scorecard metric trends
  async function loadScorecardTrends(roomIds: string[]) {
    if (roomIds.length === 0) return

    // Get active metrics
    const { data: metrics } = await supabase
      .from('scorecard_metrics')
      .select('id, title, unit, goal_value')
      .in('room_id', roomIds)
      .eq('is_active', true)
      .limit(8)

    if (!metrics || metrics.length === 0) return

    const metricIds = metrics.map(m => m.id)

    // Get entries for last 12 weeks
    const twelveWeeksAgo = format(subWeeks(new Date(), 12), 'yyyy-MM-dd')
    const { data: entries } = await supabase
      .from('scorecard_entries')
      .select('metric_id, week_start, value')
      .in('metric_id', metricIds)
      .gte('week_start', twelveWeeksAgo)
      .order('week_start', { ascending: true })

    if (entries) {
      const trends: ScorecardMetricTrend[] = metrics.map(m => ({
        metricId: m.id,
        title: m.title,
        unit: m.unit ?? undefined,
        goal: m.goal_value ?? undefined,
        entries: entries
          .filter(e => e.metric_id === m.id)
          .map(e => ({
            weekStart: e.week_start,
            label: format(parseISO(e.week_start), 'MMM d'),
            value: e.value ?? 0,
            goal: m.goal_value ?? undefined,
          })),
      }))
      setScorecardTrends(trends)
    }
  }

  // H5: Team productivity heatmap
  async function loadTeamProductivity(roomIds: string[]) {
    if (roomIds.length === 0) return

    // Get team members
    const { data: members } = await supabase
      .from('room_members')
      .select('profile_id, profiles(id, full_name)')
      .in('room_id', roomIds)

    if (!members) return

    // Unique profiles
    const profileMap = new Map<string, string>()
    members.forEach(m => {
      const p = m.profiles as any
      if (p && !profileMap.has(p.id)) {
        profileMap.set(p.id, p.full_name)
      }
    })

    const now = new Date()
    const weekLabels: string[] = []
    for (let i = 7; i >= 0; i--) {
      weekLabels.push(format(startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }), 'MMM d'))
    }

    const productivity: TeamProductivityPoint[] = []

    for (const [profileId, name] of profileMap) {
      const completions: number[] = []

      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const weekEnd = startOfWeek(subWeeks(now, i - 1), { weekStartsOn: 1 })

        const { count } = await supabase
          .from('todos')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', profileId)
          .eq('status', 'complete')
          .gte('completed_at', format(weekStart, 'yyyy-MM-dd'))
          .lt('completed_at', format(weekEnd, 'yyyy-MM-dd'))

        completions.push(count ?? 0)
      }

      productivity.push({ name, profileId, completions, weekLabels })
    }

    setTeamProductivity(productivity)
  }

  // H6: IDS resolution metrics
  async function loadIDSResolution(roomIds: string[]) {
    if (roomIds.length === 0) return

    // All issues
    const { data: issues } = await supabase
      .from('issues')
      .select('id, status, created_at, resolved_at, meeting_id')
      .in('room_id', roomIds)

    if (!issues) return

    const resolved = issues.filter(i => i.status === 'resolved')
    const open = issues.filter(i => i.status === 'open' || i.status === 'in_discussion')

    // Avg resolve time
    let totalHours = 0
    let resolvedCount = 0
    resolved.forEach(i => {
      if (i.resolved_at && i.created_at) {
        const hours = (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60)
        totalHours += hours
        resolvedCount++
      }
    })

    // Issues per meeting (last 12 meetings)
    const { data: sessions } = await supabase
      .from('meeting_sessions')
      .select('id, meeting_date')
      .in('room_id', roomIds)
      .order('meeting_date', { ascending: true })
      .limit(12)

    const perMeeting = (sessions || []).map(s => {
      const count = issues.filter(i => i.meeting_id === s.id).length
      return {
        label: format(parseISO(s.meeting_date), 'MMM d'),
        count,
      }
    })

    setIdsResolution({
      avgResolveHours: resolvedCount > 0 ? Math.round(totalHours / resolvedCount) : 0,
      issuesPerMeeting: perMeeting,
      totalResolved: resolved.length,
      totalOpen: open.length,
    })
  }

  // KPI Summary for H8
  async function loadKPISummary(roomIds: string[]) {
    if (roomIds.length === 0) return

    // Meeting sessions
    const { data: sessions } = await supabase
      .from('meeting_sessions')
      .select('rating, meeting_date')
      .in('room_id', roomIds)
      .order('meeting_date', { ascending: false })
      .limit(52)

    const ratings = sessions?.filter(s => s.rating != null).map(s => s.rating!) || []
    const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null

    // Streak
    let streak = 0
    if (sessions && sessions.length > 0) {
      streak = 1
      for (let i = 0; i < sessions.length - 1; i++) {
        const curr = new Date(sessions[i].meeting_date)
        const prev = new Date(sessions[i + 1].meeting_date)
        const daysBetween = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        if (daysBetween <= 10) streak++
        else break
      }
    }

    // Todos completion rate (all time)
    const { count: completedTodos } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')
    const { count: totalTodos } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })

    // Rocks
    const { data: rocks } = await supabase
      .from('rocks')
      .select('status')

    const rocksOnTrack = rocks?.filter(r => r.status === 'on_track').length || 0
    const rocksTotal = rocks?.length || 0

    // Issues resolved
    const { count: issuesResolved } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    setKpiSummary({
      avgRating,
      todoCompletionRate: (totalTodos ?? 0) > 0 ? Math.round(((completedTodos ?? 0) / (totalTodos ?? 1)) * 100) : 0,
      rocksOnTrack,
      rocksTotal,
      issuesResolved: issuesResolved ?? 0,
      meetingsHeld: sessions?.length || 0,
      streak,
    })
  }

  return {
    meetingRatings,
    todoCompletion,
    rockHealth,
    scorecardTrends,
    teamProductivity,
    idsResolution,
    kpiSummary,
    loading,
  }
}
