import { useState, useEffect } from 'react'
import { X, UserPlus, Calendar, AlertCircle, Repeat } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAssignTodo } from '../../hooks/usePersonalTodos'

interface TeamMember {
  id: string
  full_name: string
  avatar_url?: string
  role: string
}

interface Props {
  onClose: () => void
  onAssigned?: () => void
  preselectedUserId?: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', cls: 'text-cult-text/60' },
  { value: 'medium', label: 'Medium', cls: 'text-cult-text' },
  { value: 'high', label: 'High', cls: 'text-cult-amber-bright' },
  { value: 'critical', label: 'Critical', cls: 'text-cult-red-bright' },
]

export default function AssignTodoModal({ onClose, onAssigned, preselectedUserId }: Props) {
  const { assignTodo } = useAssignTodo()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [targetUser, setTargetUser] = useState(preselectedUserId || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState('daily')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .order('full_name')
      if (data) setMembers(data)
    }
    fetchMembers()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!targetUser) {
      setError('Please select a team member')
      return
    }
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setLoading(true)
    const result = await assignTodo({
      owner_id: targetUser,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      priority,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : undefined,
    })

    setLoading(false)

    if (result) {
      onAssigned?.()
      onClose()
    } else {
      setError('Failed to assign todo. Please try again.')
    }
  }

  const selectedMember = members.find(m => m.id === targetUser)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-cult-dark border border-cult-border rounded-lg w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cult-border">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-cult-gold" />
            <h2 className="font-display text-lg text-cult-white tracking-wider">ASSIGN TASK</h2>
          </div>
          <button onClick={onClose} className="text-cult-text hover:text-cult-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Team member selector */}
          <div>
            <label className="block text-[10px] font-mono text-cult-text tracking-wider uppercase mb-1.5">
              Assign To
            </label>
            <select
              value={targetUser}
              onChange={e => setTargetUser(e.target.value)}
              className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
                text-sm text-cult-white focus:outline-none focus:border-cult-gold/50"
            >
              <option value="">Select team member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.role}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-mono text-cult-text tracking-wider uppercase mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
                text-sm text-cult-white placeholder:text-cult-text/50 focus:outline-none
                focus:border-cult-gold/50"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono text-cult-text tracking-wider uppercase mb-1.5">
              Description <span className="text-cult-text/40">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional context or details..."
              rows={2}
              className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
                text-sm text-cult-white placeholder:text-cult-text/50 focus:outline-none
                focus:border-cult-gold/50 resize-none"
            />
          </div>

          {/* Priority + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-cult-text tracking-wider uppercase mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
                  text-sm text-cult-white focus:outline-none focus:border-cult-gold/50"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-cult-text tracking-wider uppercase mb-1.5">
                <Calendar size={10} className="inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-cult-muted border border-cult-border rounded-md px-3 py-2
                  text-sm text-cult-white focus:outline-none focus:border-cult-gold/50"
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-cult-text cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="accent-cult-gold"
              />
              <Repeat size={12} />
              Recurring task
            </label>
            {isRecurring && (
              <select
                value={recurrencePattern}
                onChange={e => setRecurrencePattern(e.target.value)}
                className="bg-cult-muted border border-cult-border rounded px-2 py-1 text-xs
                  text-cult-white focus:outline-none focus:border-cult-gold/50"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-cult-red-bright">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !title.trim() || !targetUser}
              className="flex-1 px-4 py-2.5 bg-cult-gold/20 text-cult-gold border border-cult-gold/30
                rounded-md text-xs font-mono tracking-wider uppercase hover:bg-cult-gold/30
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : `Assign to ${selectedMember?.full_name?.split(' ')[0] || 'Member'}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-cult-text text-xs font-mono hover:text-cult-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
