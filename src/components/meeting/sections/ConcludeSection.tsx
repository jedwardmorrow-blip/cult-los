import { useState, useMemo } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useToast } from '../../ui/Toast'
import { useConfetti, ConfettiOverlay } from '../../ui/Confetti'
import {
  CheckCircle2, Star, Copy, Check, Save,
  ChevronDown, ChevronUp, Target, ListTodo, MessageSquare, Users, Flame,
} from 'lucide-react'

export default function ConcludeSection() {
  const {
    todos, rocks, issues, members, presence,
    concludeRating, concludeCascading, memberRatings,
    setConcludeRating, setConcludeCascading, recordSession,
    meetingStreak,
  } = useMeeting()

  const { showToast } = useToast()
  const confetti = useConfetti()
  const [copied, setCopied] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [showOpenTodos, setShowOpenTodos] = useState(false)

  // Stats
  const todoStats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter(t => t.status === 'complete').length,
    open: todos.filter(t => t.status === 'open' || t.status === 'in_progress').length,
  }), [todos])

  const rockStats = useMemo(() => ({
    onTrack: rocks.filter(r => r.status === 'on_track').length,
    offTrack: rocks.filter(r => r.status === 'off_track').length,
    done: rocks.filter(r => r.status === 'complete').length,
  }), [rocks])

  const issueStats = useMemo(() => ({
    total: issues.length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    open: issues.filter(i => i.status === 'open' || i.status === 'in_discussion').length,
  }), [issues])

  const openTodos = useMemo(() =>
    todos.filter(t => t.status !== 'complete' && t.status !== 'dropped'),
    [todos]
  )

  const ratingFeedback: Record<number, string> = {
    1: 'Rough one', 2: 'Needs work', 3: 'Below average', 4: 'Fair',
    5: 'Average', 6: 'Decent', 7: 'Good meeting', 8: 'Great meeting',
    9: 'Excellent', 10: 'Perfect 10!',
  }

  async function handleCopyRecap() {
    const lines: string[] = []
    lines.push(`L10 Meeting Recap — ${new Date().toLocaleDateString()}`)
    lines.push('')

    if (rockStats.onTrack + rockStats.offTrack + rockStats.done > 0) {
      lines.push(`Rocks: ${rockStats.onTrack} on track, ${rockStats.offTrack} off track, ${rockStats.done} done`)
    }
    lines.push(`To-Dos: ${todoStats.completed}/${todoStats.total} complete`)
    if (issueStats.total > 0) {
      lines.push(`Issues: ${issueStats.resolved}/${issueStats.total} resolved`)
    }

    if (openTodos.length > 0) {
      lines.push('')
      lines.push('Open To-Dos:')
      for (const todo of openTodos) {
        const owner = todo.profiles?.full_name || 'Unassigned'
        lines.push(`  • ${todo.title} (${owner})`)
      }
    }

    if (concludeCascading.trim()) {
      lines.push('')
      lines.push(`Cascading Messages: ${concludeCascading}`)
    }

    if (concludeRating) {
      lines.push('')
      lines.push(`Rating: ${concludeRating}/10`)
    }

    if (meetingStreak > 1) {
      lines.push(`Meeting Streak: ${meetingStreak} weeks`)
    }

    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    showToast('Recap copied to clipboard', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  // A13: Attendees from presence
  const attendeeNames = presence.map(p => p.name).filter(Boolean)

  async function handleRecordSession() {
    await recordSession()
    setRecorded(true)
    confetti.fire()
    showToast('Session recorded successfully!', 'success')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ConfettiOverlay active={confetti.active} />

      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Recap to-dos, cascade messages, rate the meeting, and record the session
        </p>
      </div>

      {/* A13: Attendees */}
      {attendeeNames.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <Users size={12} className="text-cult-text/40" />
          <span className="text-[10px] font-mono text-cult-text/40 tracking-wider">
            Attendees: {attendeeNames.join(', ')}
          </span>
        </div>
      )}

      {/* A20: Meeting streak badge */}
      {meetingStreak > 1 && (
        <div className="flex items-center justify-center mb-5">
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full border
            ${meetingStreak >= 10
              ? 'bg-cult-gold/15 border-cult-gold/40 shadow-[0_0_16px_rgba(200,168,75,0.15)]'
              : meetingStreak >= 5
                ? 'bg-cult-gold/10 border-cult-gold/25'
                : 'bg-cult-surface border-cult-border'
            }
          `}>
            <Flame size={16} className={`${meetingStreak >= 10 ? 'text-cult-gold' : meetingStreak >= 5 ? 'text-cult-gold/70' : 'text-cult-text/50'}`} />
            <span className={`text-sm font-mono font-bold tracking-wider ${
              meetingStreak >= 10 ? 'text-cult-gold' : meetingStreak >= 5 ? 'text-cult-gold/80' : 'text-cult-white'
            }`}>
              {meetingStreak}
            </span>
            <span className="text-[10px] font-mono text-cult-text/50 tracking-wider uppercase">
              week streak
            </span>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="rounded-lg border border-cult-border bg-cult-surface p-2.5 sm:p-4 text-center">
          <Target size={16} className="mx-auto mb-1.5 text-cult-gold/60" />
          <div className="text-lg font-display text-cult-white">{rockStats.onTrack}</div>
          <div className="text-[9px] font-mono text-cult-text/40 tracking-wider uppercase">On Track</div>
        </div>
        <div className="rounded-lg border border-cult-border bg-cult-surface p-2.5 sm:p-4 text-center">
          <ListTodo size={16} className="mx-auto mb-1.5 text-cult-gold/60" />
          <div className="text-lg font-display text-cult-white">
            {todoStats.completed}<span className="text-cult-text/30 text-sm">/{todoStats.total}</span>
          </div>
          <div className="text-[9px] font-mono text-cult-text/40 tracking-wider uppercase">To-Dos Done</div>
        </div>
        <div className="rounded-lg border border-cult-border bg-cult-surface p-2.5 sm:p-4 text-center">
          <MessageSquare size={16} className="mx-auto mb-1.5 text-cult-gold/60" />
          <div className="text-lg font-display text-cult-white">
            {issueStats.resolved}<span className="text-cult-text/30 text-sm">/{issueStats.total}</span>
          </div>
          <div className="text-[9px] font-mono text-cult-text/40 tracking-wider uppercase">Issues Solved</div>
        </div>
      </div>

      {/* Open To-Dos */}
      {openTodos.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowOpenTodos(!showOpenTodos)}
            className="flex items-center gap-2 text-[10px] font-mono text-cult-text/40 tracking-wider uppercase hover:text-cult-text/60 transition-colors mb-2"
          >
            {showOpenTodos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Open To-Dos ({openTodos.length})
          </button>
          {showOpenTodos && (
            <div className="rounded-lg border border-cult-border bg-cult-surface p-3 space-y-1.5">
              {openTodos.map(todo => (
                <div key={todo.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    todo.status === 'stuck' ? 'bg-red-400' :
                    todo.status === 'in_progress' ? 'bg-cult-gold' :
                    'bg-cult-text/20'
                  }`} />
                  <span className="text-cult-white flex-1 truncate">{todo.title}</span>
                  <span className="text-[9px] font-mono text-cult-text/30 flex-shrink-0">
                    {todo.profiles?.full_name || 'Unassigned'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cascading Messages */}
      <div className="mb-6">
        <label className="block text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-2">
          Cascading Messages
        </label>
        <textarea
          value={concludeCascading}
          onChange={e => setConcludeCascading(e.target.value)}
          placeholder="What messages need to cascade to your teams?"
          rows={3}
          className="w-full bg-cult-dark border border-cult-border rounded-lg px-3 py-2.5 text-sm text-cult-white placeholder:text-cult-text/25 focus:outline-none focus:border-cult-gold/30 resize-none"
        />
      </div>

      {/* Rating — per person */}
      <div className="mb-8">
        <label className="block text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-3">
          Rate This Meeting
        </label>
        <div className="flex items-center gap-1 sm:gap-1.5 mb-2 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setConcludeRating(concludeRating === num ? null : num)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-mono transition-all duration-150 ${
                concludeRating === num
                  ? 'bg-cult-gold text-cult-black font-bold shadow-[0_0_12px_rgba(200,168,75,0.3)]'
                  : concludeRating && num <= concludeRating
                    ? 'bg-cult-gold/20 text-cult-gold'
                    : 'bg-cult-surface text-cult-text/40 hover:bg-cult-gold/10 hover:text-cult-gold'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        {concludeRating && (
          <p className="text-xs text-cult-gold/60 font-mono">
            {ratingFeedback[concludeRating]}
          </p>
        )}

        {/* Per-person rating display + average */}
        {Object.keys(memberRatings).length > 0 && (
          <div className="mt-4 p-3 rounded-lg border border-cult-border bg-cult-surface">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase">Team Ratings</span>
              <span className="text-sm font-mono text-cult-gold font-bold">
                Avg: {(Object.values(memberRatings).reduce((a, b) => a + b, 0) / Object.values(memberRatings).length).toFixed(1)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const rating = memberRatings[m.profile_id]
                if (rating == null) return (
                  <div key={m.profile_id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-cult-dark text-[10px] font-mono text-cult-text/25">
                    {(m.profiles?.full_name || '?').split(' ')[0]}: —
                  </div>
                )
                return (
                  <div key={m.profile_id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-cult-gold/10 text-[10px] font-mono text-cult-gold">
                    {(m.profiles?.full_name || '?').split(' ')[0]}: {rating}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <button
          onClick={handleCopyRecap}
          className="btn-ghost text-xs flex items-center gap-1.5"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Recap'}
        </button>

        <button
          onClick={handleRecordSession}
          disabled={recorded}
          className={`btn-gold text-xs flex items-center gap-1.5 ${recorded ? 'opacity-50' : ''}`}
        >
          {recorded ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {recorded ? 'Session Recorded' : 'Record Session'}
        </button>
      </div>
    </div>
  )
}
