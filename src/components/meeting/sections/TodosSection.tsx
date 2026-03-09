import { useState } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { ListTodo, Plus, Check, Clock, AlertTriangle, Ban } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: 'Open', icon: Clock, color: 'text-blue-400' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-400' },
  stuck: { label: 'Stuck', icon: AlertTriangle, color: 'text-red-400' },
  complete: { label: 'Done', icon: Check, color: 'text-green-400' },
  dropped: { label: 'Dropped', icon: Ban, color: 'text-cult-text/40' },
}

const STATUS_CYCLE = ['open', 'in_progress', 'complete']

export default function TodosSection() {
  const { user } = useAuth()
  const { todos, members, addTodo, updateTodoStatus } = useMeeting()
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState('')

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
  }

  // Split into active and completed
  const activeTodos = todos.filter(t => t.status !== 'complete' && t.status !== 'dropped')
  const completedTodos = todos.filter(t => t.status === 'complete' || t.status === 'dropped')

  // Check if a todo is overdue
  function isOverdue(dueDate?: string) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Review action items — mark complete, add notes, assign new tasks
        </p>
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
                  flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 group
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
                <div key={todo.id} className="flex items-center gap-3 px-4 py-2 rounded-lg opacity-40">
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