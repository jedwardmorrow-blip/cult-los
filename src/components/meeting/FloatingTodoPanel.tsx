import { useState } from 'react'
import { useMeeting } from '../../hooks/useMeetingRoom'
import { useAuth } from '../../hooks/useAuth'
import { ListTodo, Plus, X, Check, Clock } from 'lucide-react'

export default function FloatingTodoPanel() {
  const { user } = useAuth()
  const { todos, members, addTodo, updateTodoStatus, currentSection } = useMeeting()
  const [open, setOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  // Hide when on the Todos section (it's already displayed there)
  if (currentSection === 'todos') return null

  const activeTodos = todos.filter(t => t.status !== 'complete' && t.status !== 'dropped')
  const openCount = activeTodos.length

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    await addTodo(title)
    setNewTitle('')
  }

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          fixed bottom-6 right-3 sm:right-6 z-50 w-12 h-12 rounded-full
          flex items-center justify-center shadow-lg
          transition-all duration-200 hover:scale-110
          ${open
            ? 'bg-cult-dark border border-cult-border'
            : 'bg-cult-gold text-cult-black hover:bg-cult-gold/90'
          }
        `}
        title="Quick To-Dos"
      >
        {open ? (
          <X size={18} className="text-cult-text" />
        ) : (
          <>
            <ListTodo size={18} />
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-mono flex items-center justify-center">
                {openCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <div className="fixed bottom-20 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-80 max-h-[60vh] bg-cult-dark border border-cult-border rounded-lg shadow-2xl flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cult-border">
            <div className="flex items-center gap-2">
              <ListTodo size={14} className="text-cult-gold" />
              <span className="text-xs font-medium text-cult-white">To-Dos</span>
              <span className="text-[10px] font-mono text-cult-text/40">({openCount} open)</span>
            </div>
          </div>

          {/* Quick add */}
          <div className="flex gap-1.5 px-3 py-2 border-b border-cult-border/50">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Quick add..."
              className="flex-1 bg-cult-surface border border-cult-border rounded px-2 py-1.5 text-xs text-cult-white placeholder:text-cult-text/30 focus:outline-none focus:border-cult-gold/40"
            />
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="p-1.5 rounded bg-cult-gold/10 text-cult-gold hover:bg-cult-gold/20 disabled:opacity-30 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Todo list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {activeTodos.length === 0 ? (
              <p className="text-xs text-cult-text/30 text-center py-4">No open to-dos</p>
            ) : (
              activeTodos.map(todo => (
                <div key={todo.id} className="flex items-start gap-2 py-1.5 group">
                  <button
                    onClick={() => updateTodoStatus(todo.id, 'complete')}
                    className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-cult-border hover:border-cult-gold/50 flex items-center justify-center transition-colors"
                    title="Mark complete"
                  >
                    <Check size={8} className="text-cult-text/20 group-hover:text-cult-gold" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cult-white leading-snug">{todo.title}</p>
                    <span className="text-[9px] font-mono text-cult-text/30">
                      {todo.profiles?.full_name}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}