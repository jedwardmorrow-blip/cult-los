import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PersonalTodo, Todo, Profile } from '../../types'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  ListChecks,
  Repeat,
  UserPlus,
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import AssignTodoModal from './AssignTodoModal'

interface MemberSummary {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
  personalTodos: PersonalTodo[]
  teamTodos: Todo[]
  completedToday: number
  totalActive: number
  overdue: number
  upcomingDeadlines: number
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const PRIORITY_STYLES: Record<string, { cls: string; label: string }> = {
  critical: { cls: 'text-cult-red-bright bg-cult-red-bright/10 border-cult-red-bright/30', label: 'CRITICAL' },
  high: { cls: 'text-cult-amber-bright bg-cult-amber-bright/10 border-cult-amber-bright/30', label: 'HIGH' },
  medium: { cls: 'text-cult-text bg-cult-muted border-cult-border', label: 'MED' },
  low: { cls: 'text-cult-text/60 bg-cult-dark border-cult-border/50', label: 'LOW' },
}

export default function TeamOverview() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [viewFilter, setViewFilter] = useState<'all' | 'checklists' | 'todos'>('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignToUser, setAssignToUser] = useState<string | undefined>()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const today = todayStr()
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

    const [profilesRes, personalRes, completionsRes, teamTodosRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .order('full_name'),
      supabase
        .from('personal_todos')
        .select('*, profiles(id, full_name, avatar_url)')
        .neq('status', 'dropped')
        .order('sort_order'),
      supabase
        .from('personal_todo_completions')
        .select('*')
        .eq('completed_date', today),
      supabase
        .from('todos')
        .select('*, profiles(id, full_name, avatar_url)')
        .in('status', ['open', 'in_progress', 'stuck'])
        .order('due_date'),
    ])

    const profiles = profilesRes.data || []
    const personalTodos = personalRes.data || []
    const completions = completionsRes.data || []
    const teamTodos = teamTodosRes.data || []

    const completedIds = new Set(completions.map(c => c.todo_id))

    const enrichedPersonal = personalTodos.map(t => ({
      ...t,
      completed_today: completedIds.has(t.id),
    })) as PersonalTodo[]

    const summaries: MemberSummary[] = profiles.map(p => {
      const myPersonal = enrichedPersonal.filter(t => t.owner_id === p.id)
      const myTeam = (teamTodos as Todo[]).filter(t => t.owner_id === p.id)

      const completedToday = myPersonal.filter(t => {
        if (t.is_recurring) return t.completed_today
        return t.status === 'complete'
      }).length

      const activePersonal = myPersonal.filter(t => t.status !== 'complete')
      const totalActive = activePersonal.length + myTeam.length

      const overdue = [
        ...activePersonal.filter(t => t.due_date && isBefore(parseISO(t.due_date), new Date()) && !t.is_recurring),
        ...myTeam.filter(t => t.due_date && isBefore(parseISO(t.due_date), new Date())),
      ].length

      const upcoming = [
        ...activePersonal.filter(t => t.due_date && isAfter(parseISO(t.due_date), new Date()) && isBefore(parseISO(t.due_date), parseISO(nextWeek))),
        ...myTeam.filter(t => t.due_date && isAfter(parseISO(t.due_date), new Date()) && isBefore(parseISO(t.due_date), parseISO(nextWeek))),
      ].length

      return {
        profile: p as Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>,
        personalTodos: myPersonal,
        teamTodos: myTeam,
        completedToday,
        totalActive,
        overdue,
        upcomingDeadlines: upcoming,
      }
    })

    setMembers(summaries)
    setLoading(false)
  }

  const totalOverdue = members.reduce((sum, m) => sum + m.overdue, 0)
  const totalUpcoming = members.reduce((sum, m) => sum + m.upcomingDeadlines, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">
          LOADING TEAM DATA...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="font-display text-2xl text-cult-white">
            {members.reduce((s, m) => s + m.totalActive, 0)}
          </div>
          <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase mt-1">
            Total Active Items
          </div>
        </div>
        <div className="card p-4">
          <div className={`font-display text-2xl ${totalOverdue > 0 ? 'text-cult-red-bright' : 'text-cult-green-bright'}`}>
            {totalOverdue}
          </div>
          <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase mt-1">
            Overdue Items
          </div>
        </div>
        <div className="card p-4">
          <div className={`font-display text-2xl ${totalUpcoming > 0 ? 'text-cult-amber-bright' : 'text-cult-text'}`}>
            {totalUpcoming}
          </div>
          <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase mt-1">
            Due This Week
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'checklists', 'todos'] as const).map(f => (
          <button
            key={f}
            onClick={() => setViewFilter(f)}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
              viewFilter === f
                ? 'bg-cult-gold/20 text-cult-gold border border-cult-gold/30'
                : 'bg-cult-dark text-cult-text border border-cult-border hover:text-cult-white'
            }`}
          >
            {f === 'all' ? 'All Items' : f === 'checklists' ? 'Checklists' : 'Meeting Todos'}
          </button>
        ))}
      </div>

      {/* Assign modal */}
      {showAssignModal && (
        <AssignTodoModal
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => fetchAll()}
          preselectedUserId={assignToUser}
        />
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map(member => {
          const expanded = expandedMember === member.profile.id
          const initials = member.profile.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()

          return (
            <div key={member.profile.id} className="card overflow-hidden">
              {/* Member header */}
              <button
                onClick={() => setExpandedMember(expanded ? null : member.profile.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-cult-dark/50 transition-colors"
              >
                {/* Avatar */}
                {member.profile.avatar_url ? (
                  <img
                    src={member.profile.avatar_url}
                    alt={member.profile.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cult-gold/20 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-cult-gold font-bold">{initials}</span>
                  </div>
                )}

                {/* Name + role */}
                <div className="flex-1 text-left">
                  <div className="text-sm text-cult-white font-medium">{member.profile.full_name}</div>
                  <div className="text-[10px] font-mono text-cult-text uppercase tracking-wider">{member.profile.role}</div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-mono text-cult-green-bright">{member.completedToday}</div>
                    <div className="text-[9px] font-mono text-cult-text">done today</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-cult-white">{member.totalActive}</div>
                    <div className="text-[9px] font-mono text-cult-text">active</div>
                  </div>
                  {member.overdue > 0 && (
                    <div className="text-right">
                      <div className="text-xs font-mono text-cult-red-bright">{member.overdue}</div>
                      <div className="text-[9px] font-mono text-cult-text">overdue</div>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAssignToUser(member.profile.id)
                      setShowAssignModal(true)
                    }}
                    className="text-cult-text hover:text-cult-gold transition-colors p-1"
                    title={`Assign task to ${member.profile.full_name}`}
                  >
                    <UserPlus size={13} />
                  </button>
                  {expanded ? (
                    <ChevronDown size={14} className="text-cult-text" />
                  ) : (
                    <ChevronRight size={14} className="text-cult-text" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-cult-border px-4 py-3 space-y-3 bg-cult-dark/30">
                  {/* Personal checklists */}
                  {(viewFilter === 'all' || viewFilter === 'checklists') && member.personalTodos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ListChecks size={12} className="text-cult-gold" />
                        <span className="font-mono text-[10px] text-cult-gold tracking-wider uppercase">
                          Daily Checklist ({member.personalTodos.filter(t => t.is_recurring).length})
                        </span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {member.personalTodos
                          .filter(t => t.is_recurring)
                          .map(todo => (
                            <TodoRow
                              key={todo.id}
                              title={todo.title}
                              done={todo.completed_today || false}
                              dueDate={todo.due_date}
                              priority={todo.priority}
                              isRecurring
                              pattern={todo.recurrence_pattern}
                            />
                          ))}
                      </div>

                      {/* One-time personal todos */}
                      {member.personalTodos.filter(t => !t.is_recurring && t.status !== 'complete').length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-2 mt-3">
                            <CalendarDays size={12} className="text-blue-300" />
                            <span className="font-mono text-[10px] text-blue-300 tracking-wider uppercase">
                              Tasks ({member.personalTodos.filter(t => !t.is_recurring && t.status !== 'complete').length})
                            </span>
                          </div>
                          <div className="space-y-1 ml-5">
                            {member.personalTodos
                              .filter(t => !t.is_recurring && t.status !== 'complete')
                              .map(todo => (
                                <TodoRow
                                  key={todo.id}
                                  title={todo.title}
                                  done={false}
                                  dueDate={todo.due_date}
                                  priority={todo.priority}
                                />
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Team (meeting) todos */}
                  {(viewFilter === 'all' || viewFilter === 'todos') && member.teamTodos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={12} className="text-purple-300" />
                        <span className="font-mono text-[10px] text-purple-300 tracking-wider uppercase">
                          Meeting Todos ({member.teamTodos.length})
                        </span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {member.teamTodos.map(todo => (
                          <TodoRow
                            key={todo.id}
                            title={todo.title}
                            done={todo.status === 'complete'}
                            dueDate={todo.due_date}
                            priority={todo.priority}
                            status={todo.status}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {member.personalTodos.length === 0 && member.teamTodos.length === 0 && (
                    <p className="text-cult-text text-xs font-mono text-center py-3">
                      No active items
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TodoRow({
  title,
  done,
  dueDate,
  priority,
  isRecurring,
  pattern,
  status,
}: {
  title: string
  done: boolean
  dueDate?: string
  priority?: string
  isRecurring?: boolean
  pattern?: string
  status?: string
}) {
  const overdue = dueDate && !done && isBefore(parseISO(dueDate), new Date())
  const priorityStyle = priority && priority !== 'medium' ? PRIORITY_STYLES[priority] : null

  return (
    <div className="flex items-center gap-2 py-1">
      {done ? (
        <CheckCircle2 size={13} className="text-cult-green-bright flex-shrink-0" />
      ) : (
        <Circle size={13} className={`flex-shrink-0 ${overdue ? 'text-cult-red-bright' : 'text-cult-border'}`} />
      )}
      <span className={`text-xs flex-1 truncate ${done ? 'text-cult-text line-through' : 'text-cult-white'}`}>
        {title}
      </span>
      {isRecurring && (
        <Repeat size={10} className="text-cult-text/50 flex-shrink-0" />
      )}
      {status === 'stuck' && (
        <AlertTriangle size={10} className="text-cult-amber-bright flex-shrink-0" />
      )}
      {priorityStyle && (
        <span className={`px-1.5 py-0.5 text-[8px] font-mono tracking-wider rounded-sm border ${priorityStyle.cls} flex-shrink-0`}>
          {priorityStyle.label}
        </span>
      )}
      {dueDate && (
        <span className={`font-mono text-[9px] flex-shrink-0 flex items-center gap-1 ${overdue ? 'text-cult-red-bright' : 'text-cult-text'}`}>
          {overdue && <Clock size={9} />}
          {format(parseISO(dueDate), 'MMM d')}
        </span>
      )}
    </div>
  )
}
