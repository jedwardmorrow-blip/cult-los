import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../components/ui/Toast'
import { ConfettiOverlay, useConfetti } from '../components/ui/Confetti'
import AssignTodoModal from '../components/admin/AssignTodoModal'
import {
  ChevronLeft, ChevronRight, Calendar, Circle, CheckCircle2,
  Users, User, Plus, ArrowUp, ArrowDown, AlertTriangle, Minus,
  Clock, Check, Ban, Filter,
} from 'lucide-react'
import type { PersonalTodo, Todo } from '../types'

interface DayTodo {
  id: string
  title: string
  type: 'personal' | 'team'
  status: string
  completed: boolean
  due_date: string
  owner_id?: string
  owner_name?: string
  priority?: string
}

interface TeamMember {
  id: string
  full_name: string
  avatar_url?: string
}

// C1+C3+C4: Status cycling config
const STATUS_CYCLE_PERSONAL = ['pending', 'complete']
const STATUS_CYCLE_TEAM = ['open', 'in_progress', 'complete']

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-blue-400' },
  open: { label: 'Open', icon: Clock, color: 'text-blue-400' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-400' },
  complete: { label: 'Done', icon: Check, color: 'text-green-400' },
  stuck: { label: 'Stuck', icon: AlertTriangle, color: 'text-red-400' },
  dropped: { label: 'Dropped', icon: Ban, color: 'text-cult-text/40' },
}

// Priority badge config
const PRIORITY_BADGE: Record<string, { color: string; icon: React.ElementType }> = {
  low: { color: 'text-cult-text/40', icon: ArrowDown },
  high: { color: 'text-amber-400', icon: ArrowUp },
  critical: { color: 'text-red-400', icon: AlertTriangle },
}

// C1: Color palette for team members in admin view
const MEMBER_COLORS = [
  'bg-cult-gold', 'bg-cyan-400', 'bg-purple-400', 'bg-pink-400',
  'bg-emerald-400', 'bg-orange-400', 'bg-blue-400', 'bg-rose-400',
]

export default function CalendarPage() {
  const { user } = useAuth()
  const { canViewAllTodos, canAssignTodos } = usePermissions()
  const { showToast } = useToast()
  const confetti = useConfetti()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([])
  const [teamTodos, setTeamTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  // C1: Admin view toggle + team members
  const [viewMode, setViewMode] = useState<'mine' | 'team'>('mine')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [memberFilter, setMemberFilter] = useState<string>('all')

  // C2: Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignDate, setAssignDate] = useState('')

  // C1: Fetch team members for admin view
  useEffect(() => {
    if (!canViewAllTodos) return
    async function fetchMembers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .order('full_name')
      if (data) setTeamMembers(data)
    }
    fetchMembers()
  }, [canViewAllTodos])

  // Fetch todos from Supabase
  const fetchTodos = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      if (viewMode === 'team' && canViewAllTodos) {
        // C1: Admin — fetch ALL team members' todos
        const [personalRes, teamRes] = await Promise.all([
          supabase
            .from('personal_todos')
            .select('*, profiles!personal_todos_owner_id_fkey(id, full_name, avatar_url)')
            .neq('status', 'dropped'),
          supabase
            .from('todos')
            .select('*, profiles(id, full_name, avatar_url)')
            .neq('status', 'dropped'),
        ])

        if (personalRes.error) throw personalRes.error
        if (teamRes.error) throw teamRes.error

        setPersonalTodos(personalRes.data || [])
        setTeamTodos(teamRes.data || [])
      } else {
        // My View — own todos + todos I assigned to others
        const [personalRes, teamRes] = await Promise.all([
          canAssignTodos
            ? supabase
                .from('personal_todos')
                .select('*, profiles!personal_todos_owner_id_fkey(id, full_name, avatar_url)')
                .or(`owner_id.eq.${user.id},assigned_by.eq.${user.id}`)
                .neq('status', 'dropped')
            : supabase
                .from('personal_todos')
                .select('*, profiles!personal_todos_owner_id_fkey(id, full_name, avatar_url)')
                .eq('owner_id', user.id)
                .neq('status', 'dropped'),
          supabase
            .from('todos')
            .select('*, profiles(id, full_name, avatar_url)')
            .eq('owner_id', user.id)
            .neq('status', 'dropped'),
        ])

        if (personalRes.error) throw personalRes.error
        if (teamRes.error) throw teamRes.error

        setPersonalTodos(personalRes.data || [])
        setTeamTodos(teamRes.data || [])
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, viewMode, canViewAllTodos, canAssignTodos])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return

    const personalFilter = viewMode === 'team' && canViewAllTodos
      ? {}
      : { filter: `owner_id=eq.${user.id}` }
    const teamFilter = viewMode === 'team' && canViewAllTodos
      ? {}
      : { filter: `owner_id=eq.${user.id}` }

    const channel = supabase
      .channel('calendar-todos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_todos', ...personalFilter },
        () => fetchTodos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', ...teamFilter },
        () => fetchTodos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchTodos, viewMode, canViewAllTodos])

  // C1: Get member color index
  const getMemberColor = useCallback((ownerId: string) => {
    const idx = teamMembers.findIndex(m => m.id === ownerId)
    return MEMBER_COLORS[idx % MEMBER_COLORS.length] || 'bg-cult-text/40'
  }, [teamMembers])

  // Get todos for a specific date (with admin filtering)
  const getTodosForDate = useCallback(
    (date: Date): DayTodo[] => {
      const dateStr = date.toISOString().split('T')[0]

      const personalForDate: DayTodo[] = personalTodos
        .filter((t) => t.due_date === dateStr)
        .filter((t) => memberFilter === 'all' || t.owner_id === memberFilter)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: 'personal' as const,
          status: t.status,
          completed: t.status === 'complete',
          due_date: t.due_date!,
          owner_id: t.owner_id,
          owner_name: (t as any).profiles?.full_name || 'Unknown',
          priority: t.priority,
        }))

      const teamForDate: DayTodo[] = teamTodos
        .filter((t) => t.due_date === dateStr)
        .filter((t) => memberFilter === 'all' || t.owner_id === memberFilter)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: 'team' as const,
          status: t.status,
          completed: t.status === 'complete',
          due_date: t.due_date!,
          owner_id: t.owner_id || undefined,
          owner_name: (t as any).profiles?.full_name || 'Unassigned',
          priority: t.priority,
        }))

      return [...personalForDate, ...teamForDate]
    },
    [personalTodos, teamTodos, memberFilter]
  )

  // Calendar dot indicators
  const getDateIndicators = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      const isTeamView = viewMode === 'team'

      if (isTeamView) {
        // C1: Show colored dots per member
        const ownerIds = new Set<string>()
        personalTodos.filter(t => t.due_date === dateStr && (memberFilter === 'all' || t.owner_id === memberFilter)).forEach(t => { if (t.owner_id) ownerIds.add(t.owner_id) })
        teamTodos.filter(t => t.due_date === dateStr && (memberFilter === 'all' || t.owner_id === memberFilter)).forEach(t => { if (t.owner_id) ownerIds.add(t.owner_id) })
        return Array.from(ownerIds).slice(0, 4) // max 4 dots
      } else {
        const hasPersonal = personalTodos.some(t => t.due_date === dateStr)
        const hasTeam = teamTodos.some(t => t.due_date === dateStr)
        return { hasPersonal, hasTeam }
      }
    },
    [personalTodos, teamTodos, viewMode, memberFilter]
  )

  // C3: Inline completion toggle
  async function handleToggleStatus(todo: DayTodo) {
    try {
      if (todo.type === 'personal') {
        const cycle = STATUS_CYCLE_PERSONAL
        const idx = cycle.indexOf(todo.status)
        const next = cycle[(idx + 1) % cycle.length]
        await supabase
          .from('personal_todos')
          .update({ status: next, completed_at: next === 'complete' ? new Date().toISOString() : null })
          .eq('id', todo.id)
        if (next === 'complete') {
          confetti.fire()
          showToast('Todo completed!', 'success')
        }
      } else {
        const cycle = STATUS_CYCLE_TEAM
        const idx = cycle.indexOf(todo.status)
        const next = cycle[(idx + 1) % cycle.length]
        await supabase
          .from('todos')
          .update({ status: next, completed_at: next === 'complete' ? new Date().toISOString() : null })
          .eq('id', todo.id)
        if (next === 'complete') {
          confetti.fire()
          showToast('Todo completed!', 'success')
        }
      }
    } catch (err) {
      console.error('Error toggling status:', err)
      showToast('Failed to update status', 'error')
    }
  }

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const start = new Date(first)
    start.setDate(start.getDate() - first.getDay())

    const days: Date[] = []
    const current = new Date(start)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSameDay = (date1: Date, date2: Date | null): boolean => {
    if (!date2) return false
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate)

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedDayTodos = selectedDate ? getTodosForDate(selectedDate) : []

  // C2: Open assign modal with preselected date
  function handleAssignFromCalendar() {
    if (!selectedDate) return
    setAssignDate(selectedDate.toISOString().split('T')[0])
    setShowAssignModal(true)
  }

  return (
    <div className="flex h-full gap-6">
      <ConfettiOverlay active={confetti.active} />

      {/* Calendar Section */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display text-2xl text-cult-white tracking-wide">Calendar</h1>
            {/* C1: View mode toggle for admins */}
            {canViewAllTodos && (
              <div className="flex items-center gap-1 bg-cult-dark border border-cult-border rounded-lg p-0.5">
                <button
                  onClick={() => { setViewMode('mine'); setMemberFilter('all') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono tracking-wider uppercase transition-colors ${
                    viewMode === 'mine' ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/50 hover:text-cult-text/70'
                  }`}
                >
                  <User size={11} /> My View
                </button>
                <button
                  onClick={() => setViewMode('team')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono tracking-wider uppercase transition-colors ${
                    viewMode === 'team' ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/50 hover:text-cult-text/70'
                  }`}
                >
                  <Users size={11} /> Team View
                </button>
              </div>
            )}
          </div>
          <p className="text-xs font-mono text-cult-text mt-1 mb-4">
            {viewMode === 'team' ? 'All team members\' todos & deadlines' : 'Upcoming todos & deadlines'}
          </p>

          {/* C1: Member filter chips (team view only) */}
          {viewMode === 'team' && teamMembers.length > 0 && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              <Filter size={12} className="text-cult-text/30 flex-shrink-0" />
              <button
                onClick={() => setMemberFilter('all')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors tracking-wider uppercase whitespace-nowrap ${
                  memberFilter === 'all' ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/40 hover:text-cult-text/60'
                }`}
              >
                All
              </button>
              {teamMembers.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setMemberFilter(m.id)}
                  className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded transition-colors tracking-wider whitespace-nowrap ${
                    memberFilter === m.id ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/40 hover:text-cult-text/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${MEMBER_COLORS[idx % MEMBER_COLORS.length]}`} />
                  {m.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between bg-cult-dark rounded-lg p-3 border border-cult-border">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-cult-muted rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} className="text-cult-gold" />
              </button>

              <h2 className="font-display text-lg text-cult-white min-w-[180px] text-center">
                {monthName}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-cult-muted rounded transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} className="text-cult-gold" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="flex items-center gap-2 px-3 py-1.5 bg-cult-gold/20 text-cult-gold
                border border-cult-gold/30 rounded-md text-xs font-mono
                hover:bg-cult-gold/30 transition-colors"
            >
              <Calendar size={12} />
              Today
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center font-mono text-[10px] uppercase tracking-wider text-cult-text/60 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((date, index) => {
            const isOtherMonth = !isCurrentMonth(date)
            const isTodayDate = isToday(date)
            const isSelected = isSameDay(date, selectedDate)
            const indicators = getDateIndicators(date)

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(new Date(date))}
                className={`
                  relative min-h-[72px] p-2 rounded-md border transition-all
                  flex flex-col items-start justify-between
                  ${isTodayDate
                    ? 'border-cult-gold bg-cult-muted'
                    : isSelected
                      ? 'border-cult-gold/60 bg-cult-dark'
                      : 'border-cult-border bg-cult-dark hover:bg-cult-muted/50'
                  }
                  ${isOtherMonth ? 'opacity-25' : ''}
                `}
              >
                <span
                  className={`font-mono text-[11px] font-medium ${
                    isOtherMonth
                      ? 'text-cult-text'
                      : isTodayDate
                        ? 'text-cult-gold'
                        : 'text-cult-white'
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Indicator dots */}
                <div className="flex gap-1 flex-wrap">
                  {viewMode === 'team' && Array.isArray(indicators) ? (
                    // C1: Colored dots per member in team view
                    (indicators as string[]).map((ownerId) => (
                      <div key={ownerId} className={`w-1.5 h-1.5 rounded-full ${getMemberColor(ownerId)}`} />
                    ))
                  ) : (
                    // Normal view: gold=personal, cyan=team
                    <>
                      {(indicators as any).hasPersonal && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cult-gold" />
                      )}
                      {(indicators as any).hasTeam && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* C4: Enhanced Detail Panel */}
      {selectedDate && (
        <div className="w-80 flex-shrink-0 flex flex-col bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
          {/* Detail Header */}
          <div className="bg-cult-muted border-b border-cult-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm text-cult-white tracking-wide">
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  }).format(selectedDate)}
                </h3>
                <p className="text-cult-text text-[10px] font-mono mt-0.5">
                  {selectedDayTodos.length} item{selectedDayTodos.length !== 1 ? 's' : ''}
                </p>
              </div>
              {/* C2: Quick assign button */}
              {canAssignTodos && (
                <button
                  onClick={handleAssignFromCalendar}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-cult-gold
                    bg-cult-gold/10 border border-cult-gold/20 rounded hover:bg-cult-gold/20 transition-colors"
                >
                  <Plus size={10} />
                  Assign
                </button>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedDayTodos.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={24} className="text-cult-text/30 mx-auto mb-2" />
                <p className="text-cult-text/50 text-xs font-mono">
                  Nothing scheduled
                </p>
              </div>
            ) : (
              selectedDayTodos.map((todo) => {
                const config = STATUS_CONFIG[todo.status] || STATUS_CONFIG.open
                const StatusIcon = config.icon
                const pb = todo.priority && PRIORITY_BADGE[todo.priority]

                return (
                  <div
                    key={todo.id}
                    className={`
                      px-3 py-2.5 rounded-md border transition-all
                      ${todo.completed
                        ? 'border-cult-border/30 bg-cult-black/30 opacity-50'
                        : 'border-cult-border/50 bg-cult-black/50 hover:bg-cult-muted/30'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* C3: Clickable status toggle */}
                      <button
                        onClick={() => handleToggleStatus(todo)}
                        className={`mt-0.5 flex-shrink-0 p-0.5 rounded transition-colors ${config.color} hover:opacity-80`}
                        title={`Status: ${config.label} — click to cycle`}
                      >
                        <StatusIcon size={14} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug ${
                            todo.completed
                              ? 'text-cult-text line-through'
                              : 'text-cult-white'
                          }`}
                        >
                          {todo.title}
                        </p>

                        {/* C4: Status + type + owner info */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`text-[9px] font-mono inline-block ${
                              todo.type === 'personal'
                                ? 'text-cult-gold/60'
                                : 'text-cyan-400/60'
                            }`}
                          >
                            {todo.type === 'personal' ? 'Personal' : 'Team'}
                          </span>
                          <span className={`text-[9px] font-mono ${config.color}`}>
                            {config.label}
                          </span>
                          {(viewMode === 'team' || (todo.owner_id && todo.owner_id !== user?.id)) && todo.owner_name && (
                            <span className="text-[9px] font-mono text-cult-text/40">
                              {todo.owner_id !== user?.id ? `→ ${todo.owner_name.split(' ')[0]}` : todo.owner_name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Priority badge */}
                      {pb && (() => {
                        const PIcon = pb.icon
                        return <PIcon size={11} className={`flex-shrink-0 mt-0.5 ${pb.color}`} />
                      })()}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Legend */}
          <div className="border-t border-cult-border px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cult-gold" />
              <span className="text-[9px] font-mono text-cult-text/40">Personal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[9px] font-mono text-cult-text/40">Team</span>
            </div>
          </div>
        </div>
      )}

      {/* C2: Assign Todo Modal */}
      {showAssignModal && (
        <AssignTodoModal
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            // Switch to team view after assigning so the task is immediately visible
            if (viewMode === 'mine' && canViewAllTodos) {
              setViewMode('team')
            }
            fetchTodos()
            showToast('Task assigned!', 'success')
          }}
          preselectedDueDate={assignDate}
        />
      )}
    </div>
  )
}
