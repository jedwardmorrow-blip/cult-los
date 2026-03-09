import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ChevronLeft, ChevronRight, Calendar, Circle, CheckCircle2 } from 'lucide-react'
import type { PersonalTodo, Todo } from '../types'

interface DayTodo {
  id: string
  title: string
  type: 'personal' | 'team'
  status: string
  completed: boolean
  due_date: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([])
  const [teamTodos, setTeamTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch todos from Supabase
  const fetchTodos = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      const [personalRes, teamRes] = await Promise.all([
        supabase
          .from('personal_todos')
          .select('*')
          .eq('owner_id', user.id)
          .neq('status', 'dropped'),
        supabase
          .from('todos')
          .select('*')
          .eq('owner_id', user.id)
          .neq('status', 'dropped'),
      ])

      if (personalRes.error) throw personalRes.error
      if (teamRes.error) throw teamRes.error

      setPersonalTodos(personalRes.data || [])
      setTeamTodos(teamRes.data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('calendar-todos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_todos', filter: `owner_id=eq.${user.id}` },
        () => fetchTodos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `owner_id=eq.${user.id}` },
        () => fetchTodos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchTodos])

  // Get todos for a specific date
  const getTodosForDate = useCallback(
    (date: Date): DayTodo[] => {
      const dateStr = date.toISOString().split('T')[0]

      const personalForDate: DayTodo[] = personalTodos
        .filter((t) => t.due_date === dateStr)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: 'personal' as const,
          status: t.status,
          completed: t.status === 'complete',
          due_date: t.due_date!,
        }))

      const teamForDate: DayTodo[] = teamTodos
        .filter((t) => t.due_date === dateStr)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: 'team' as const,
          status: t.status,
          completed: t.status === 'complete',
          due_date: t.due_date!,
        }))

      return [...personalForDate, ...teamForDate]
    },
    [personalTodos, teamTodos]
  )

  const hasPersonalTodos = useCallback(
    (date: Date): boolean => {
      const dateStr = date.toISOString().split('T')[0]
      return personalTodos.some((t) => t.due_date === dateStr)
    },
    [personalTodos]
  )

  const hasTeamTodos = useCallback(
    (date: Date): boolean => {
      const dateStr = date.toISOString().split('T')[0]
      return teamTodos.some((t) => t.due_date === dateStr)
    },
    [teamTodos]
  )

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

  return (
    <div className="flex h-full gap-6">
      {/* Calendar Section */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl text-cult-white tracking-wide">Calendar</h1>
          <p className="text-xs font-mono text-cult-text mt-1 mb-4">Upcoming todos &amp; deadlines</p>

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
            const hasPersonal = hasPersonalTodos(date)
            const hasTeam = hasTeamTodos(date)

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
                <div className="flex gap-1">
                  {hasPersonal && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cult-gold" />
                  )}
                  {hasTeam && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDate && (
        <div className="w-72 flex-shrink-0 flex flex-col bg-cult-dark border border-cult-border rounded-lg overflow-hidden">
          {/* Detail Header */}
          <div className="bg-cult-muted border-b border-cult-border px-4 py-3">
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
              selectedDayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`
                    flex items-start gap-2.5 px-3 py-2.5 rounded-md
                    border border-cult-border/50 bg-cult-black/50
                    ${todo.completed ? 'opacity-40' : ''}
                  `}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {todo.completed ? (
                      <CheckCircle2 size={13} className="text-cult-gold" />
                    ) : (
                      <Circle
                        size={13}
                        className={
                          todo.type === 'personal'
                            ? 'text-cult-gold'
                            : 'text-cyan-400'
                        }
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs ${
                        todo.completed
                          ? 'text-cult-text line-through'
                          : 'text-cult-white'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <span
                      className={`text-[9px] font-mono mt-0.5 inline-block ${
                        todo.type === 'personal'
                          ? 'text-cult-gold/60'
                          : 'text-cyan-400/60'
                      }`}
                    >
                      {todo.type === 'personal' ? 'Personal' : 'Team'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
