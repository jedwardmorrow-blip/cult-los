import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { usePersonalTodos, useAllPersonalTodos, useAssignedToMeTodos } from '../hooks/usePersonalTodos'
import {
  Plus,
  Check,
  Trash2,
  Repeat,
  Calendar,
  ChevronDown,
  ChevronRight,
  Users,
  ListChecks,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import type { PersonalTodo } from '../types'
import AvatarStack from '../components/shared/AvatarStack'
import MentionText from '../components/shared/MentionText'
import AskClaudeButton from '../components/shared/AskClaudeButton'

// B5/B6/B7: Category configuration
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  operations: { label: 'Ops', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' },
  cultivation: { label: 'Grow', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  sales: { label: 'Sales', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  finance: { label: 'Finance', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  compliance: { label: 'Comply', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  marketing: { label: 'Mktg', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
  hr: { label: 'HR', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  technology: { label: 'Tech', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  strategic: { label: 'Strategy', color: 'text-cult-gold', bg: 'bg-cult-gold/10 border-cult-gold/30' },
  general: { label: 'General', color: 'text-cult-text/50', bg: 'bg-cult-text/5 border-cult-border' },
}

// B1/B2: Priority configuration — shared across all todo views
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; sort: number }> = {
  low: { label: 'Low', color: 'text-cult-text/60', bg: 'bg-cult-text/5 border-cult-border', icon: ArrowDown, sort: 0 },
  medium: { label: 'Med', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: Minus, sort: 1 },
  high: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: ArrowUp, sort: 2 },
  critical: { label: 'Crit', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertTriangle, sort: 3 },
}

export default function PersonalTodosPage() {
  const { profile } = useAuth()
  const { canViewAllTodos } = usePermissions()
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-cult-white tracking-wide">
            My Checklist
          </h1>
          <p className="text-xs font-mono text-cult-text mt-1">
            Personal daily tasks & recurring habits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AskClaudeButton context="checklist" />
          {canViewAllTodos && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono
                bg-cult-muted border border-cult-border text-cult-text hover:text-cult-white transition-colors"
            >
              <Users size={13} />
              {showAdmin ? 'My View' : 'Team View'}
            </button>
          )}
        </div>
      </div>

      {showAdmin && canViewAllTodos ? <AdminTodoView /> : <MyTodoView />}
    </div>
  )
}

// ── Personal View ──
function MyTodoView() {
  const { todos, loading, addTodo, toggleComplete, dropTodo, isDone } =
    usePersonalTodos()
  // D5: Cross-department assigned tasks
  const { assignedTodos, loading: assignedLoading } = useAssignedToMeTodos()
  const [newTitle, setNewTitle] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<string>('medium')
  const [category, setCategory] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  // B6: Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await addTodo({
      title: newTitle.trim(),
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? 'daily' : undefined,
      due_date: dueDate || undefined,
      priority,
      category: category || undefined,
    })
    setNewTitle('')
    setIsRecurring(false)
    setDueDate('')
    setPriority('medium')
    setCategory('')
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="font-mono text-xs text-cult-text animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  // B8: Compute effective priority — overdue items escalate one level
  function effectivePriority(todo: PersonalTodo): number {
    const base = PRIORITY_CONFIG[todo.priority || 'medium']?.sort ?? 1
    if (todo.due_date && todo.status !== 'complete') {
      const due = new Date(todo.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (due < today) return Math.min(base + 1, 3) // escalate but cap at critical(3)
    }
    return base
  }

  // B3+B8: Sort by effective priority (critical/overdue first)
  function byPriority(a: PersonalTodo, b: PersonalTodo) {
    return effectivePriority(b) - effectivePriority(a)
  }

  // B6: Active categories in the current todos (for filter chips)
  const activeCategories = [...new Set(todos.map(t => t.category).filter(Boolean))] as string[]

  // B6: Apply category filter
  const filtered = categoryFilter === 'all' ? todos : todos.filter(t => (t.category || '') === categoryFilter)

  const recurring = filtered.filter(t => t.is_recurring)
  const oneTime = filtered.filter(t => !t.is_recurring && t.status !== 'complete').sort(byPriority)
  const completed = filtered.filter(
    t => !t.is_recurring && t.status === 'complete'
  )

  return (
    <div className="space-y-6">
      {/* B6: Category filter chips */}
      {activeCategories.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-cult-gold/15 border-cult-gold/30 text-cult-gold'
                : 'border-cult-border text-cult-text/40 hover:text-cult-text/60'
            }`}
          >
            All
          </button>
          {activeCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat]
            if (!cfg) return null
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                  categoryFilter === cat
                    ? `${cfg.bg} ${cfg.color}`
                    : 'border-cult-border text-cult-text/40 hover:text-cult-text/60'
                }`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Add new button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono
            border border-dashed border-cult-border text-cult-text hover:text-cult-gold
            hover:border-cult-gold/40 transition-colors w-full justify-center"
        >
          <Plus size={14} />
          Add Item
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-cult-dark border border-cult-border rounded-lg p-4 space-y-3"
        >
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
              text-sm text-cult-white placeholder:text-cult-text/50 focus:outline-none
              focus:border-cult-gold/50"
            autoFocus
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-cult-text cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="accent-cult-gold"
              />
              <Repeat size={12} />
              Daily recurring
            </label>
            {!isRecurring && (
              <label className="flex items-center gap-2 text-xs text-cult-text">
                <Calendar size={12} />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-cult-muted border border-cult-border rounded px-2 py-1 text-xs
                    text-cult-white focus:outline-none focus:border-cult-gold/50"
                />
              </label>
            )}
          </div>
          {/* B1: Priority selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase">Priority</span>
            <div className="flex gap-1">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-all border ${
                      priority === key
                        ? `${cfg.bg} ${cfg.color} font-medium`
                        : 'border-transparent text-cult-text/30 hover:text-cult-text/50'
                    }`}
                  >
                    <Icon size={10} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          {/* B5: Category selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase">Category</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-cult-muted border border-cult-border rounded px-2 py-1 text-[10px] font-mono
                text-cult-white focus:outline-none focus:border-cult-gold/50"
            >
              <option value="">None</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-cult-gold/20 text-cult-gold border border-cult-gold/30
                rounded-md text-xs font-mono hover:bg-cult-gold/30 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-cult-text text-xs font-mono hover:text-cult-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Daily Habits */}
      {recurring.length > 0 && (
        <TodoSection
          title="Daily Habits"
          icon={<Repeat size={12} className="text-cult-gold/70" />}
          count={`${recurring.filter(t => isDone(t)).length}/${recurring.length}`}
        >
          {recurring.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              done={isDone(todo)}
              onToggle={() => toggleComplete(todo.id)}
              onDrop={() => dropTodo(todo.id)}
            />
          ))}
        </TodoSection>
      )}

      {/* One-time tasks */}
      {oneTime.length > 0 && (
        <TodoSection
          title="Tasks"
          icon={<ListChecks size={12} className="text-cult-text/60" />}
          count={String(oneTime.length)}
        >
          {oneTime.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              done={false}
              onToggle={() => toggleComplete(todo.id)}
              onDrop={() => dropTodo(todo.id)}
            />
          ))}
        </TodoSection>
      )}

      {/* D5: Cross-department — tasks where I'm a co-assignee */}
      {!assignedLoading && assignedTodos.length > 0 && (
        <TodoSection
          title="Assigned to Me"
          icon={<UserCheck size={12} className="text-cult-gold/70" />}
          count={String(assignedTodos.filter(t => t.status !== 'complete').length)}
        >
          {assignedTodos
            .filter(t => t.status !== 'complete')
            .map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-cult-muted/20"
              >
                <div className="w-5 h-5 rounded border border-cult-border flex items-center justify-center flex-shrink-0">
                  {todo.status === 'complete' && <Check size={12} className="text-cult-gold" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-cult-white">{todo.title}</span>
                  {todo.profiles && (
                    <span className="block text-[10px] text-cult-text/40 mt-0.5">
                      from {todo.profiles.full_name}
                    </span>
                  )}
                </div>
                {todo.priority && todo.priority !== 'medium' && (() => {
                  const cfg = PRIORITY_CONFIG[todo.priority]
                  if (!cfg) return null
                  const Icon = cfg.icon
                  return (
                    <span className={`flex items-center gap-0.5 text-[9px] font-mono tracking-wider ${cfg.color} flex-shrink-0`}>
                      <Icon size={10} />
                      {cfg.label}
                    </span>
                  )
                })()}
                {todo.due_date && (
                  <span className="text-[10px] font-mono text-cult-text/50 flex-shrink-0">
                    {todo.due_date}
                  </span>
                )}
              </div>
            ))}
        </TodoSection>
      )}

      {/* Completed (collapsible) */}
      {completed.length > 0 && (
        <CompletedSection todos={completed} onToggle={toggleComplete} />
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="text-center py-16">
          <ListChecks
            size={32}
            className="text-cult-text/30 mx-auto mb-3"
          />
          <p className="text-sm text-cult-text/60 font-mono">
            No items yet. Add your first task or daily habit.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Admin Team View ──
function AdminTodoView() {
  const { allTodos, loading } = useAllPersonalTodos()

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="font-mono text-xs text-cult-text animate-pulse">
          Loading team data...
        </div>
      </div>
    )
  }

  // Group by owner
  const grouped = allTodos.reduce(
    (acc, todo) => {
      const name = todo.profiles?.full_name || 'Unknown'
      if (!acc[name]) acc[name] = []
      acc[name].push(todo)
      return acc
    },
    {} as Record<string, PersonalTodo[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([name, userTodos]) => {
        const doneCount = userTodos.filter(t => {
          if (t.is_recurring) return t.completed_today
          return t.status === 'complete'
        }).length
        return (
          <div
            key={name}
            className="bg-cult-dark border border-cult-border rounded-lg overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-cult-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center">
                  <span className="text-[8px] font-mono text-cult-gold font-medium">
                    {name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm text-cult-white font-medium">
                  {name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cult-text">
                {doneCount}/{userTodos.length} done
              </span>
            </div>
            <div className="divide-y divide-cult-border/50">
              {userTodos.map(todo => {
                const done = todo.is_recurring
                  ? todo.completed_today
                  : todo.status === 'complete'
                return (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${done ? 'opacity-40' : ''}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        done
                          ? 'bg-cult-gold/20 border-cult-gold/40'
                          : 'border-cult-border'
                      }`}
                    >
                      {done && <Check size={10} className="text-cult-gold" />}
                    </div>
                    <span
                      className={`text-xs flex-1 ${
                        done
                          ? 'text-cult-text line-through'
                          : 'text-cult-white'
                      }`}
                    >
                      {todo.title}
                    </span>
                    {/* B7: Category badge in admin view */}
                    {todo.category && CATEGORY_CONFIG[todo.category] && (
                      <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${CATEGORY_CONFIG[todo.category].bg} ${CATEGORY_CONFIG[todo.category].color}`}>
                        {CATEGORY_CONFIG[todo.category].label}
                      </span>
                    )}
                    {/* B2: Priority badge in admin view */}
                    {todo.priority && todo.priority !== 'medium' && (() => {
                      const cfg = PRIORITY_CONFIG[todo.priority]
                      if (!cfg) return null
                      const Icon = cfg.icon
                      return (
                        <span className={`flex items-center gap-0.5 text-[9px] font-mono ${cfg.color}`}>
                          <Icon size={9} />
                        </span>
                      )
                    })()}
                    {todo.is_recurring && (
                      <Repeat size={10} className="text-cult-text/40" />
                    )}
                    {todo.due_date && (
                      <span className="text-[10px] font-mono text-cult-text/50">
                        {todo.due_date}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16">
          <Users size={32} className="text-cult-text/30 mx-auto mb-3" />
          <p className="text-sm text-cult-text/60 font-mono">
            No team members have created personal todos yet.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Shared Components ──

function TodoSection({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <span className="text-[10px] font-mono text-cult-text/60 tracking-wider uppercase">
          {title}
        </span>
        <span className="text-[10px] font-mono text-cult-text/40">
          ({count})
        </span>
      </div>
      <div className="bg-cult-dark border border-cult-border rounded-lg divide-y divide-cult-border/50 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function TodoItem({
  todo,
  done,
  onToggle,
  onDrop,
}: {
  todo: PersonalTodo
  done: boolean
  onToggle: () => void
  onDrop?: () => void
}) {
  // B8: Check if overdue
  const isOverdue = !done && todo.due_date && (() => {
    const due = new Date(todo.due_date!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  })()

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-cult-muted/20 ${
        done ? 'opacity-50' : ''
      } ${isOverdue ? 'bg-red-500/5' : ''}`}
    >
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          done
            ? 'bg-cult-gold/20 border-cult-gold/40'
            : 'border-cult-border hover:border-cult-gold/40'
        }`}
      >
        {done && <Check size={12} className="text-cult-gold" />}
      </button>
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            done ? 'text-cult-text line-through' : 'text-cult-white'
          }`}
        >
          {todo.title}
        </span>
        {/* D4: Render @mentions in descriptions */}
        {todo.description && (
          <MentionText
            text={todo.description}
            className="block text-[10px] text-cult-text/50 mt-0.5 truncate"
          />
        )}
      </div>
      {/* D3: Assignee avatar stack */}
      {todo.assignees && todo.assignees.length > 0 && (
        <AvatarStack people={todo.assignees} />
      )}
      {/* B7: Category badge */}
      {todo.category && CATEGORY_CONFIG[todo.category] && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${CATEGORY_CONFIG[todo.category].bg} ${CATEGORY_CONFIG[todo.category].color}`}>
          {CATEGORY_CONFIG[todo.category].label}
        </span>
      )}
      {/* B2: Priority badge */}
      {todo.priority && todo.priority !== 'medium' && (() => {
        const cfg = PRIORITY_CONFIG[todo.priority]
        if (!cfg) return null
        const Icon = cfg.icon
        return (
          <span className={`flex items-center gap-0.5 text-[9px] font-mono tracking-wider ${cfg.color} flex-shrink-0`}>
            <Icon size={10} />
            {cfg.label}
          </span>
        )
      })()}
      {todo.is_recurring && (
        <Repeat size={11} className="text-cult-gold/40 flex-shrink-0" />
      )}
      {todo.due_date && !todo.is_recurring && (
        <span className={`text-[10px] font-mono flex-shrink-0 ${isOverdue ? 'text-red-400 font-medium' : 'text-cult-text/50'}`}>
          {isOverdue ? 'OVERDUE' : todo.due_date}
        </span>
      )}
      {onDrop && (
        <button
          onClick={onDrop}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-cult-text hover:text-cult-red-bright"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function CompletedSection({
  todos,
  onToggle,
}: {
  todos: PersonalTodo[]
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-2 px-1 text-cult-text/40 hover:text-cult-text transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-mono tracking-wider uppercase">
          Completed ({todos.length})
        </span>
      </button>
      {open && (
        <div className="bg-cult-dark border border-cult-border rounded-lg divide-y divide-cult-border/50 overflow-hidden">
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              done={true}
              onToggle={() => onToggle(todo.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
