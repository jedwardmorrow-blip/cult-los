import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Goal, Rock, Todo, Issue } from '../types'
import {
  Target, CheckSquare, AlertCircle, TrendingUp, ArrowRight, Circle,
  Flame, Calendar, Clock, Star, Users, Play,
} from 'lucide-react'
import ClaudeRecommendations from '../components/ClaudeRecommendations'
import { format, differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns'

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', cls: 'text-cult-text', dot: 'bg-cult-muted' },
  in_progress: { label: 'In Progress', cls: 'text-cult-amber-bright', dot: 'bg-cult-amber-bright' },
  completed: { label: 'Done', cls: 'text-cult-green-bright', dot: 'bg-cult-green-bright' },
  at_risk: { label: 'At Risk', cls: 'text-cult-red-bright', dot: 'bg-cult-red-bright' },
}

const PHASE_COLORS = {
  1: 'bg-cult-gold/10 text-cult-gold border-cult-gold/30',
  2: 'bg-blue-900/20 text-blue-300 border-blue-700/30',
  3: 'bg-purple-900/20 text-purple-300 border-purple-700/30',
}

// ── C5/C6 types ──
interface MeetingRoomInfo {
  id: string
  name: string
  cadence: string
  next_meeting_day?: number // 0=Sun..6=Sat
}

interface RecentSession {
  id: string
  room_id: string
  meeting_date: string
  rating: number | null
  todo_stats: any
  rock_stats: any
  issue_stats: any
  room_name?: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>([])
  const [rocks, setRocks] = useState<Rock[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [northStar, setNorthStar] = useState<string>('')
  const [planDates, setPlanDates] = useState<{ start: string; end: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // C5: Meeting room + streak state
  const [rooms, setRooms] = useState<MeetingRoomInfo[]>([])
  const [meetingStreak, setMeetingStreak] = useState(0)
  // C6: Recent sessions
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  useEffect(() => { if (profile) fetchAll() }, [profile])

  async function fetchAll() {
    if (!profile) return
    setLoading(true)
    const [plansRes, goalsRes, rocksRes, todosRes, issuesRes] = await Promise.all([
      supabase.from('plans').select('*').eq('profile_id', profile.id).eq('status', 'active').single(),
      supabase.from('goals').select('*').eq('profile_id', profile.id).order('phase').limit(6),
      supabase.from('rocks').select('*').eq('owner_id', profile.id).order('created_at').limit(5),
      supabase.from('todos').select('*').eq('owner_id', profile.id).eq('status', 'open').order('due_date').limit(5),
      supabase.from('issues').select('*').eq('owner_id', profile.id).eq('status', 'open').order('priority').limit(5),
    ])
    if (plansRes.data) { setNorthStar(plansRes.data.north_star); setPlanDates({ start: plansRes.data.start_date, end: plansRes.data.end_date }) }
    setGoals(goalsRes.data || [])
    setRocks(rocksRes.data || [])
    setTodos(todosRes.data || [])
    setIssues(issuesRes.data || [])

    // C5/C6: Load meeting data
    await loadMeetingData(profile.id)

    setLoading(false)
  }

  // C5: Load user's meeting rooms, streak, and recent sessions
  async function loadMeetingData(userId: string) {
    // Get rooms user belongs to
    const { data: memberData } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('profile_id', userId)

    if (!memberData || memberData.length === 0) return

    const roomIds = memberData.map(m => m.room_id)

    // Load room info
    const { data: roomData } = await supabase
      .from('meeting_rooms')
      .select('id, name, cadence, next_meeting_day')
      .in('id', roomIds)
    if (roomData) setRooms(roomData)

    // Load streak (from first room — primary L10)
    const primaryRoomId = roomIds[0]
    const { data: sessions } = await supabase
      .from('meeting_sessions')
      .select('meeting_date')
      .eq('room_id', primaryRoomId)
      .order('meeting_date', { ascending: false })
      .limit(52)

    if (sessions && sessions.length > 0) {
      let streak = 1
      for (let i = 0; i < sessions.length - 1; i++) {
        const curr = new Date(sessions[i].meeting_date)
        const prev = new Date(sessions[i + 1].meeting_date)
        const daysBetween = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        if (daysBetween <= 10) {
          streak++
        } else {
          break
        }
      }
      setMeetingStreak(streak)
    }

    // C6: Load recent sessions across all rooms
    const { data: recentData } = await supabase
      .from('meeting_sessions')
      .select('id, room_id, meeting_date, rating, todo_stats, rock_stats, issue_stats')
      .in('room_id', roomIds)
      .order('meeting_date', { ascending: false })
      .limit(5)

    if (recentData && roomData) {
      const roomMap = new Map(roomData.map(r => [r.id, r.name]))
      setRecentSessions(recentData.map(s => ({
        ...s,
        room_name: roomMap.get(s.room_id) || 'Unknown',
      })))
    }
  }

  // C5: Compute next meeting date from room's next_meeting_day
  function getNextMeetingDate(room: MeetingRoomInfo): Date | null {
    if (room.next_meeting_day === undefined || room.next_meeting_day === null) return null
    const today = new Date()
    const todayDay = today.getDay()
    let daysUntil = room.next_meeting_day - todayDay
    if (daysUntil <= 0) daysUntil += 7
    return addDays(today, daysUntil)
  }

  const daysLeft = planDates ? differenceInDays(parseISO(planDates.end), new Date()) : null
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const progressPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0
  const firstName = profile?.full_name?.split(' ')[0] || ''
  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">LOADING...</div></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-cult-text tracking-widest uppercase mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="font-display text-4xl tracking-wider text-cult-white">{greeting()}, {firstName.toUpperCase()}</h1>
        </div>
        {daysLeft !== null && (
          <div className="text-right">
            <div className="font-display text-4xl text-cult-gold">{daysLeft}</div>
            <div className="font-mono text-xs text-cult-text tracking-wider">DAYS REMAINING</div>
          </div>
        )}
      </div>

      {northStar && (
        <div className="card p-5 border-cult-gold/30 bg-cult-gold/5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-sm bg-cult-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target size={16} className="text-cult-gold" />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">North Star · Q1 2026</div>
              <p className="text-cult-white text-sm leading-relaxed">{northStar}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── E1: Claude Recommendations (top 3) ── */}
      <ClaudeRecommendations maxItems={3} compact />

      {/* ── C5: L-10 Meeting Section ── */}
      {rooms.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-cult-gold" />
              <span className="font-mono text-xs text-cult-text tracking-wider uppercase">L-10 Meetings</span>
            </div>
            <Link to="/meetings" className="text-cult-gold text-xs font-mono hover:underline flex items-center gap-1">
              All Rooms <ArrowRight size={10} />
            </Link>
          </div>

          <div className="space-y-3">
            {rooms.map(room => {
              const nextDate = getNextMeetingDate(room)
              const daysUntilMeeting = nextDate ? differenceInDays(nextDate, new Date()) : null

              return (
                <div key={room.id} className="flex items-center gap-4 p-3 rounded-lg border border-cult-border bg-cult-surface">
                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cult-white font-medium truncate">{room.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {nextDate && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-cult-text/60">
                          <Calendar size={10} />
                          Next: {format(nextDate, 'EEE, MMM d')}
                          {daysUntilMeeting !== null && daysUntilMeeting <= 1 && (
                            <span className="text-cult-gold ml-1">
                              {daysUntilMeeting === 0 ? '(Today!)' : '(Tomorrow)'}
                            </span>
                          )}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-cult-text/40 capitalize">{room.cadence || 'Weekly'}</span>
                    </div>
                  </div>

                  {/* Streak badge */}
                  {meetingStreak > 1 && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                      meetingStreak >= 10
                        ? 'bg-cult-gold/15 border-cult-gold/40'
                        : meetingStreak >= 5
                          ? 'bg-cult-gold/10 border-cult-gold/25'
                          : 'bg-cult-surface border-cult-border'
                    }`}>
                      <Flame size={12} className={meetingStreak >= 5 ? 'text-cult-gold' : 'text-cult-text/50'} />
                      <span className={`text-xs font-mono font-bold ${meetingStreak >= 5 ? 'text-cult-gold' : 'text-cult-white'}`}>
                        {meetingStreak}
                      </span>
                    </div>
                  )}

                  {/* Quick-enter button */}
                  <button
                    onClick={() => navigate(`/meetings/${room.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cult-gold/20 text-cult-gold border border-cult-gold/30
                      rounded-md text-[10px] font-mono tracking-wider uppercase hover:bg-cult-gold/30 transition-colors"
                  >
                    <Play size={10} />
                    Enter
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-cult-text tracking-wider uppercase">90-Day Progress</span>
            <span className="font-mono text-xs text-cult-gold">{completedGoals}/{goals.length} goals complete</span>
          </div>
          <div className="h-1.5 bg-cult-muted rounded-full overflow-hidden">
            <div className="h-full bg-cult-gold rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open Goals', value: goals.filter(g => g.status !== 'completed').length, icon: Target, color: 'text-cult-gold' },
          { label: 'Active Rocks', value: rocks.filter(r => r.status !== 'complete').length, icon: TrendingUp, color: 'text-blue-300' },
          { label: 'Open To-Dos', value: todos.length, icon: CheckSquare, color: 'text-cult-green-bright' },
          { label: 'Open Issues', value: issues.length, icon: AlertCircle, color: 'text-cult-red-bright' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className={`${color} mb-3`} />
            <div className={`font-display text-3xl ${color} mb-1`}>{value}</div>
            <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Active Goals</span>
            <Link to="/plan" className="text-cult-gold text-xs font-mono hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
          </div>
          <div className="space-y-2">
            {goals.filter(g => g.status !== 'completed').slice(0, 5).map(goal => {
              const s = STATUS_CONFIG[goal.status]
              return (
                <div key={goal.id} className="flex items-start gap-3 py-2 border-b border-cult-border/50 last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cult-white leading-snug">{goal.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`phase-pill border ${PHASE_COLORS[goal.phase]} text-[9px]`}>Day {goal.phase === 1 ? '1-30' : goal.phase === 2 ? '31-60' : '61-90'}</span>
                      <span className={`font-mono text-[9px] ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {goals.filter(g => g.status !== 'completed').length === 0 && <p className="text-cult-text text-xs font-mono text-center py-4">All goals complete</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-cult-text tracking-wider uppercase">To-Dos</span>
              <Link to="/todos" className="text-cult-gold text-xs font-mono hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
            </div>
            <div className="space-y-2">
              {todos.slice(0, 3).map(todo => (
                <div key={todo.id} className="flex items-center gap-2">
                  <Circle size={12} className="text-cult-border flex-shrink-0" />
                  <span className="text-xs text-cult-white flex-1 truncate">{todo.title}</span>
                  {todo.due_date && <span className="font-mono text-[9px] text-cult-text flex-shrink-0">{format(parseISO(todo.due_date), 'MMM d')}</span>}
                </div>
              ))}
              {todos.length === 0 && <p className="text-cult-text text-xs font-mono text-center py-2">No open to-dos</p>}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Open Issues</span>
              <Link to="/issues" className="text-cult-gold text-xs font-mono hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
            </div>
            <div className="space-y-2">
              {issues.slice(0, 3).map(issue => {
                const priorityColors: Record<string, string> = { critical: 'text-cult-red-bright', high: 'text-cult-amber-bright', medium: 'text-cult-text', low: 'text-cult-text/60' }
                return (
                  <div key={issue.id} className="flex items-center gap-2">
                    <AlertCircle size={12} className={priorityColors[issue.priority]} />
                    <span className="text-xs text-cult-white flex-1 truncate">{issue.title}</span>
                    <span className={`font-mono text-[9px] uppercase ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                  </div>
                )
              })}
              {issues.length === 0 && <p className="text-cult-text text-xs font-mono text-center py-2">No open issues</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── C6: Recent Meeting Sessions ── */}
      {recentSessions.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cult-gold" />
              <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Recent Meetings</span>
            </div>
            <Link to="/meetings" className="text-cult-gold text-xs font-mono hover:underline flex items-center gap-1">
              View all <ArrowRight size={10} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentSessions.map(session => {
              const todoStats = session.todo_stats as { completed?: number; total?: number } | null
              const issueStats = session.issue_stats as { resolved?: number; total?: number } | null

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-cult-border bg-cult-surface"
                >
                  {/* Date */}
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="text-xs font-mono text-cult-text/40">
                      {format(parseISO(session.meeting_date), 'MMM')}
                    </div>
                    <div className="text-lg font-display text-cult-white">
                      {format(parseISO(session.meeting_date), 'd')}
                    </div>
                  </div>

                  {/* Room + stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cult-white truncate">{session.room_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {todoStats && (
                        <span className="text-[10px] font-mono text-cult-text/50">
                          {todoStats.completed ?? 0}/{todoStats.total ?? 0} to-dos
                        </span>
                      )}
                      {issueStats && (
                        <span className="text-[10px] font-mono text-cult-text/50">
                          {issueStats.resolved ?? 0}/{issueStats.total ?? 0} issues
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {session.rating && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star size={12} className={session.rating >= 8 ? 'text-cult-gold fill-cult-gold' : 'text-cult-text/40'} />
                      <span className={`text-sm font-mono font-bold ${
                        session.rating >= 8 ? 'text-cult-gold' : session.rating >= 5 ? 'text-cult-white' : 'text-cult-text/60'
                      }`}>
                        {session.rating}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
