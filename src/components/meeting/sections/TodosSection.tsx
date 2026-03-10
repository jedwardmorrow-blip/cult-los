import { useState, useMemo } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../ui/Toast'
import { ConfettiOverlay, useConfetti } from '../../ui/Confetti'
import { ListTodo, Plus, Check, Clock, AlertTriangle, Ban, Filter, ArrowUp, ArrowDown, Minus } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: 'Open', icon: Clock, color: 'text-blue-400' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-400' },
  stuck: { label: 'Stuck', icon: AlertTriangle, color: 'text-red-400' },
  complete: { label: 'Done', icon: Check, color: 'text-green-400' },
  dropped: { label: 'Dropped', icon: Ban, color: 'text-cult-text/40' },
}

const STATUS_CYCLE = ['open', 'in_progress', 'complete']

// B2: Priority display config for meeting todos
const PRIORITY_BADGE: Record<string, { color: string; icon: React.ElementType }> = {
  low: { color: 'text-cult-text/40', icon: ArrowDown },
  high: { color: 'text-amber-400', icon: ArrowUp },
  critical: { color: 'text-red-400', icon: AlertTriangle },
}

export default function TodosSection() {
  const { user } = useAuth()
  const { todos, members, addTodo, updateTodoStatus } = useMeeting()
  const { showToast } = useToast()
  const confetti = useConfetti()
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState('')
  // A9: Owner filter — 'all' | 'mine' | specific profile_id
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    await addTodo(title, newOwner || undefined)
    setNewTitle('')
    setNewOwner('')
  }

  function cycleTodoStatus(id: string, currentStatus: string) {
    const idx = STATUS_CYCLE.indexOf(currentStatus)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateTodoStatus(id, next)
    // Fire confetti + toast when completing a todo
    if (next === 'complete') {
      confetti.fire()
      showToast('To-do completed!', 'success')
    }
  }

  // A9: Filter todos by owner
  const filteredTodos = useMemo(() => {
    if (ownerFilter === 'all') return todos
    if (ownerFilter === 'mine') return todos.filter(t => t.owner_id === user?.id)
    return todos.filter(t => t.owner_id === ownerFilter)
  }, [todos, ownerFilter, user?.id])

  // B3: Priority sort order
  const PRIORITY_SORT: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }

  // Split into active and completed, sort active by priority (critical first)
  const activeTodos = filteredTodos
    .filter(t => t.status !== 'complete' && t.status !== 'dropped')
    .sort((a, b) => (PRIORITY_SORT[b.priority || 'medium'] ?? 1) - (PRIORITY_SORT[a.priority || 'medium'] ?? 1))
  const completedTodos = filteredTodos.filter(t => t.status === 'complete' || t.status === 'dropped')

  // A10: Completion percentage (based on ALL todos, not filtered)
  const totalCount = todos.length
  const doneCount = todos.filter(t => t.status === 'complete').length
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Check if a todo is overdue
  function isOverdue(dueDate?: string) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <ConfettiOverlay active={confetti.active} />
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Review action items — mark complete, add notes, assign new tasks
        </p>
      </div>

      {/* A10: Completion percentage bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase">
              Completion
            </span>
            <span className={`text-[10px] font-mono tracking-wider ${
              completionPct === 100 ? 'text-green-400' : completionPct >= 70 ? 'text-cult-gold' : 'text-cult-text/50'
            }`}>
              {doneCount}/{totalCount} ({completionPct}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-cult-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPct === 100 ? 'bg-green-500' : completionPct >= 70 ? 'bg-cult-gold' : 'bg-cult-gold/60'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* A9: Owner filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={12} className="text-cult-text/30" />
        <div className="flex gap-1">
          <button
            onClick={() => setOwnerFilter('all')}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors tracking-wider uppercase ${
              ownerFilter === 'all' ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/40 hover:text-cult-text/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOwnerFilter('mine')}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors tracking-wider uppercase ${
              ownerFilter === 'mine' ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/40 hover:text-cult-text/60'
            }`}
          >
            Mine
          </button>
          {members.filter(m => m.profile_id !== user?.id).map(m => (
            <button
              key={m.profile_id}
              onClick={() => setOwnerFilter(m.profile_id)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors tracking-wider ${
                ownerFilter === m.profile_id ? 'bg-cult-gold/20 text-cult-gold' : 'text-cult-text/40 hover:text-cult-text/60'
              }`}
            >
              {(m.profiles?.full_name || 'Unknown').split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Add todo form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a to-do..."
          className="input-field flex-1"
        />
        <select
          value={newOwner}
          onChange={e => setNewOwner(e.target.value)}
          className="input-field w-36 text-xs"
        >
          <option value="">Assign to me</option>
          {members.map(m => (
            <option key={m.profile_id} value={m.profile_id}>
              {m.profiles?.full_name || 'Unknown'}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="btn-gold text-xs flex items-center gap-1.5 disabled:opacity-30"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Active todos */}
      {activeTodos.length === 0 ? (
        <div className="text-center py-8">
          <ListTodo size={24} className="mx-auto text-cult-text/20 mb-2" />
          <p className="text-xs text-cult-text/40">All caught up! Add new to-dos above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeTodos.map(todo => {
            const config = STATUS_CONFIG[todo.status] || STATUS_CONFIG.open
            const StatusIcon = config.icon
            const overdue = isOverdue(todo.due_date) && todo.status !== 'complete'

            return (
              <div
                key={todo.id}
                className={`
                  flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-200 group
                  ${overdue
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-cult-border bg-cult-surface hover:bg-cult-surface/80'
                  }
                `}
              >
                {/* Status button — cycle on click */}
                <button
                  onClick={() => cycleTodoStatus(todo.id, todo.status)}
                  className={`flex-shrink-0 p-1 rounded transition-colors ${config.color} hover:opacity-80`}
                  title={`Status: ${config.label} — click to cycle`}
                >
                  <StatusIcon size={16} />
                </button>

                {/* Todo info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cult-white">{todo.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-mono text-cult-text/40">
                      {todo.profiles?.full_name || 'Unassigned'}
                    </span>
                    {todo.due_date && (
                      <span className={`text-[10px] font-mono ${overdue ? 'text-red-400' : 'text-cult-text/30'}`}>
                        Due {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* B2: Priority badge */}
                {todo.priority && PRIORITY_BADGE[todo.priority] && (() => {
                  const pb = PRIORITY_BADGE[todo.priority!]
                  const PIcon = pb.icon
                  return <PIcon size={12} className={`flex-shrink-0 ${pb.color}`} />
                })()}

                {/* Status badge */}
                <span className={`text-[9px] font-mono tracking-wider uppercase ${config.color}`}>
                  {config.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed section */}
      {completedTodos.length > 0 && (
        <div className="mt-6">
          <div className="text-[10px] font-mono text-cult-text/30 tracking-wider uppercase mb-2">
            Completed ({completedTodos.length})
          </div>
          <div className="space-y-1">
            {completedTodos.slice(0, 10).map(todo => {
              const config = STATUS_CONFIG[todo.status] || STATUS_CONFIG.complete
              return (
                <div key={todo.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg opacity-40">
                  <Check size={14} className="text-green-400/60 flex-shrink-0" />
                  <p className="text-xs text-cult-text line-through flex-1 truncate">{todo.title}</p>
                  <span className="text-[10px] font-mono text-cult-text/30">
                    {todo.profiles?.full_name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}