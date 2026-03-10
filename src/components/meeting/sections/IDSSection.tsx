import { useState, useMemo, useRef, useEffect } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../ui/Toast'
import { Issue } from '../../../types'
import {
  MessageSquare, Plus, ThumbsUp, ChevronDown, ChevronUp,
  Check, Send, ListTodo, StickyNote, X, Timer,
} from 'lucide-react'

export default function IDSSection() {
  const { user } = useAuth()
  const {
    issues, issueVotes, issueNotes, discussingIssueId,
    addIssue, voteIssue, setDiscussing, updateIssueDraft,
    solveIssue, addIssueNote, issueToTodo, members,
  } = useMeeting()
  const { showToast } = useToast()

  const [newTitle, setNewTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState<Record<string, string>>({})
  const [solveDraft, setSolveDraft] = useState<Record<string, string>>({})
  const [solvingIssueId, setSolvingIssueId] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)

  // A12: Track discussion time per issue
  const [discussionTimes, setDiscussionTimes] = useState<Record<string, number>>({})
  const discussStartRef = useRef<{ issueId: string; startTime: number } | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Accumulate time for previously-discussed issue
    if (discussStartRef.current) {
      const elapsed = (Date.now() - discussStartRef.current.startTime) / 1000
      const prevId = discussStartRef.current.issueId
      setDiscussionTimes(prev => ({
        ...prev,
        [prevId]: (prev[prevId] || 0) + elapsed,
      }))
      discussStartRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }

    if (discussingIssueId) {
      discussStartRef.current = { issueId: discussingIssueId, startTime: Date.now() }
      tickRef.current = setInterval(() => {
        if (discussStartRef.current) {
          const elapsed = (Date.now() - discussStartRef.current.startTime) / 1000
          setDiscussionTimes(prev => ({
            ...prev,
            [discussStartRef.current!.issueId]: (prev[discussStartRef.current!.issueId] || 0) + elapsed,
          }))
          discussStartRef.current!.startTime = Date.now()
        }
      }, 1000)
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [discussingIssueId])

  function formatDiscussionTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`
  }

  // Split open vs resolved
  const openIssues = useMemo(() =>
    issues.filter(i => i.status === 'open' || i.status === 'in_discussion'),
    [issues]
  )
  const resolvedIssues = useMemo(() =>
    issues.filter(i => i.status === 'resolved' || i.status === 'dropped'),
    [issues]
  )

  // Sort open issues by vote count desc, then sort_order asc
  const sortedOpen = useMemo(() => {
    const voteCounts: Record<string, number> = {}
    for (const v of issueVotes) {
      voteCounts[v.issue_id] = (voteCounts[v.issue_id] || 0) + 1
    }
    return [...openIssues].sort((a, b) => {
      const va = voteCounts[a.id] || 0
      const vb = voteCounts[b.id] || 0
      if (vb !== va) return vb - va
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
  }, [openIssues, issueVotes])

  function getVoteCount(issueId: string) {
    return issueVotes.filter(v => v.issue_id === issueId).length
  }

  function hasVoted(issueId: string) {
    if (!user) return false
    return issueVotes.some(v => v.issue_id === issueId && v.profile_id === user.id)
  }

  function getNotesForIssue(issueId: string) {
    return issueNotes.filter(n => n.issue_id === issueId)
  }

  async function handleAddIssue() {
    const title = newTitle.trim()
    if (!title) return
    await addIssue(title)
    setNewTitle('')
    setShowAddForm(false)
  }

  async function handleAddNote(issueId: string) {
    const text = (noteText[issueId] || '').trim()
    if (!text) return
    await addIssueNote(issueId, text)
    setNoteText(prev => ({ ...prev, [issueId]: '' }))
  }

  function handleStartSolve(issue: Issue) {
    setSolvingIssueId(issue.id)
    setSolveDraft(prev => ({
      ...prev,
      [issue.id]: issue.resolution_draft || issue.solution || '',
    }))
  }

  async function handleConfirmSolve(issueId: string) {
    const solution = (solveDraft[issueId] || '').trim()
    if (!solution) return
    await solveIssue(issueId, solution)
    setSolvingIssueId(null)
    showToast('Issue solved!', 'success')
  }

  const priorityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    medium: 'text-cult-gold bg-cult-gold/10',
    low: 'text-cult-text/50 bg-cult-surface',
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Identify, Discuss, Solve — work through the top issues until solved
        </p>
      </div>

      {/* Add issue bar */}
      {showAddForm ? (
        <div className="mb-6 p-4 rounded-lg border border-cult-border bg-cult-surface">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddIssue()}
              placeholder="What's the issue?"
              className="input-field flex-1"
              autoFocus
            />
            <button
              onClick={handleAddIssue}
              disabled={!newTitle.trim()}
              className="btn-gold text-xs flex items-center gap-1.5 disabled:opacity-30"
            >
              <Plus size={14} />
              Add
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewTitle('') }}
              className="btn-ghost text-xs"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-6 py-2.5 rounded-lg border border-dashed border-cult-border hover:border-cult-gold/40 text-xs font-mono text-cult-text/40 hover:text-cult-gold/80 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add Issue
        </button>
      )}

      {/* Open issues list */}
      {sortedOpen.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={24} className="mx-auto text-cult-text/20 mb-2" />
          <p className="text-xs text-cult-text/40">No open issues — add one above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedOpen.map((issue, idx) => {
            const isDiscussing = discussingIssueId === issue.id
            const isExpanded = expandedIssueId === issue.id
            const isSolving = solvingIssueId === issue.id
            const notes = getNotesForIssue(issue.id)
            const votes = getVoteCount(issue.id)
            const voted = hasVoted(issue.id)

            return (
              <div
                key={issue.id}
                className={`rounded-lg border transition-all duration-200 ${
                  isDiscussing
                    ? 'border-cult-gold/60 bg-cult-gold/5 shadow-[0_0_20px_rgba(200,168,75,0.08)]'
                    : 'border-cult-border bg-cult-surface hover:bg-cult-surface/80'
                }`}
              >
                {/* Issue header row */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                  {/* Rank */}
                  <span className="text-[10px] font-mono text-cult-text/25 w-4 text-right flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Vote button */}
                  <button
                    onClick={() => voteIssue(issue.id)}
                    className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                      voted
                        ? 'bg-cult-gold/20 text-cult-gold'
                        : 'bg-cult-surface text-cult-text/40 hover:text-cult-gold hover:bg-cult-gold/10'
                    }`}
                    title={voted ? 'Remove vote' : 'Vote for this issue'}
                  >
                    <ThumbsUp size={12} />
                    {votes > 0 && <span>{votes}</span>}
                  </button>

                  {/* Title + meta */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  >
                    <div className="flex items-center gap-2">
                      <p className={`text-sm leading-snug ${isDiscussing ? 'text-cult-white font-medium' : 'text-cult-white'}`}>
                        {issue.title}
                      </p>
                      {issue.priority && issue.priority !== 'medium' && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${priorityColor[issue.priority] || ''}`}>
                          {issue.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-cult-text/30">
                        {issue.submitted_by_name || 'Unknown'}
                      </span>
                      {notes.length > 0 && (
                        <span className="text-[9px] font-mono text-cult-text/25 flex items-center gap-0.5">
                          <StickyNote size={8} /> {notes.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* A12: Discussion time badge */}
                    {(discussionTimes[issue.id] || 0) > 0 && (
                      <span className={`text-[9px] font-mono items-center gap-0.5 hidden sm:flex ${
                        isDiscussing ? 'text-cult-gold' : 'text-cult-text/25'
                      }`}>
                        <Timer size={9} />
                        {formatDiscussionTime(discussionTimes[issue.id])}
                      </span>
                    )}
                    {!isDiscussing ? (
                      <button
                        onClick={() => setDiscussing(issue.id)}
                        className="text-[10px] font-mono px-2.5 py-1.5 rounded bg-cult-gold/10 text-cult-gold hover:bg-cult-gold/20 transition-colors tracking-wider uppercase"
                      >
                        Discuss
                      </button>
                    ) : (
                      <button
                        onClick={() => setDiscussing(null)}
                        className="text-[10px] font-mono px-2.5 py-1.5 rounded bg-cult-gold text-cult-black hover:bg-cult-gold/90 transition-colors tracking-wider uppercase"
                      >
                        Active
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                      className="p-1.5 rounded hover:bg-cult-border/30 text-cult-text/30 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-cult-border/50">
                    {/* Description */}
                    {issue.description && (
                      <p className="text-xs text-cult-text/60 mb-3 pl-4 sm:pl-8">{issue.description}</p>
                    )}

                    {/* Discussion notes */}
                    {notes.length > 0 && (
                      <div className="pl-4 sm:pl-8 mb-3 space-y-1.5">
                        <div className="text-[9px] font-mono text-cult-text/30 tracking-wider uppercase mb-1">
                          Notes
                        </div>
                        {notes.map(note => (
                          <div key={note.id} className="flex gap-2 text-xs">
                            <span className="text-cult-gold/60 font-mono text-[10px] flex-shrink-0">
                              {note.profiles?.full_name || '?'}:
                            </span>
                            <span className="text-cult-text/70">{note.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note input */}
                    <div className="flex gap-1.5 pl-4 sm:pl-8 mb-3">
                      <input
                        type="text"
                        value={noteText[issue.id] || ''}
                        onChange={e => setNoteText(prev => ({ ...prev, [issue.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddNote(issue.id)}
                        placeholder="Add a note..."
                        className="flex-1 bg-cult-dark border border-cult-border/50 rounded px-2.5 py-1.5 text-xs text-cult-white placeholder:text-cult-text/25 focus:outline-none focus:border-cult-gold/30"
                      />
                      <button
                        onClick={() => handleAddNote(issue.id)}
                        disabled={!(noteText[issue.id] || '').trim()}
                        className="p-1.5 rounded bg-cult-gold/10 text-cult-gold hover:bg-cult-gold/20 disabled:opacity-20 transition-colors"
                      >
                        <Send size={12} />
                      </button>
                    </div>

                    {/* Solve flow */}
                    {isSolving ? (
                      <div className="pl-4 sm:pl-8 space-y-2">
                        <div className="text-[9px] font-mono text-cult-gold/60 tracking-wider uppercase">
                          Solution
                        </div>
                        <textarea
                          value={solveDraft[issue.id] || ''}
                          onChange={e => setSolveDraft(prev => ({ ...prev, [issue.id]: e.target.value }))}
                          placeholder="Describe the solution..."
                          rows={3}
                          className="w-full bg-cult-dark border border-cult-gold/30 rounded px-3 py-2 text-xs text-cult-white placeholder:text-cult-text/25 focus:outline-none focus:border-cult-gold/50 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmSolve(issue.id)}
                            disabled={!(solveDraft[issue.id] || '').trim()}
                            className="btn-gold text-xs flex items-center gap-1.5 disabled:opacity-30"
                          >
                            <Check size={12} />
                            Confirm Solved
                          </button>
                          <button
                            onClick={() => setSolvingIssueId(null)}
                            className="btn-ghost text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pl-4 sm:pl-8">
                        <button
                          onClick={() => handleStartSolve(issue)}
                          className="text-[10px] font-mono px-2.5 py-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors tracking-wider uppercase flex items-center gap-1"
                        >
                          <Check size={10} />
                          Solve
                        </button>
                        <button
                          onClick={() => issueToTodo(issue)}
                          className="text-[10px] font-mono px-2.5 py-1.5 rounded bg-cult-surface text-cult-text/50 hover:bg-cult-gold/10 hover:text-cult-gold transition-colors tracking-wider uppercase flex items-center gap-1"
                        >
                          <ListTodo size={10} />
                          To-Do
                        </button>
                        {issue.resolution_draft && (
                          <span className="text-[9px] font-mono text-cult-text/25 flex items-center gap-1">
                            <StickyNote size={8} /> draft saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Resolved issues */}
      {resolvedIssues.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="flex items-center gap-2 text-[10px] font-mono text-cult-text/30 tracking-wider uppercase hover:text-cult-text/50 transition-colors mb-2"
          >
            {showResolved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Resolved ({resolvedIssues.length})
          </button>

          {showResolved && (
            <div className="space-y-1.5">
              {resolvedIssues.map(issue => (
                <div
                  key={issue.id}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-lg opacity-50"
                >
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded bg-green-500/20 flex items-center justify-center">
                    <Check size={10} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cult-text line-through">{issue.title}</p>
                    {issue.solution && (
                      <p className="text-[10px] text-cult-text/40 mt-0.5">
                        → {issue.solution}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}