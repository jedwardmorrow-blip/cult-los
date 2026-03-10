import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useMeeting } from '../../hooks/useMeetingRoom'
import { MeetingSession } from '../../types/meeting'
import {
  History, X, Star, ChevronDown, ChevronUp,
  Target, ListTodo, MessageSquare, Users,
  Calendar, Download, Filter, Search,
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SessionHistoryPanel({ open, onClose }: Props) {
  const { room } = useMeeting()
  const [sessions, setSessions] = useState<MeetingSession[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // A15: Filtering state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minRating, setMinRating] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open && room) loadSessions()
  }, [open, room])

  async function loadSessions() {
    if (!room) return
    setLoading(true)
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('room_id', room.id)
      .order('meeting_date', { ascending: false })
    if (data) setSessions(data)
    setLoading(false)
  }

  // A15: Apply filters
  const filteredSessions = useMemo(() => {
    let result = sessions
    if (dateFrom) {
      result = result.filter(s => s.meeting_date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter(s => s.meeting_date <= dateTo)
    }
    if (minRating !== '') {
      result = result.filter(s => (s.rating || 0) >= Number(minRating))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.cascading_messages?.toLowerCase().includes(q) ||
        s.meeting_date.includes(q)
      )
    }
    return result
  }, [sessions, dateFrom, dateTo, minRating, searchQuery])

  // A16: Export to CSV
  function exportCSV() {
    const headers = ['Date', 'Rating', 'Todos (Done/Total)', 'Rocks (On/Off/Done)', 'Issues (Resolved/Total)', 'Cascading Messages']
    const rows = filteredSessions.map(s => [
      s.meeting_date,
      s.rating?.toString() || '',
      `${s.todo_stats?.completed || 0}/${s.todo_stats?.total || 0}`,
      `${s.rock_stats?.onTrack || 0}/${s.rock_stats?.offTrack || 0}/${s.rock_stats?.done || 0}`,
      `${s.issue_stats?.resolved || 0}/${s.issue_stats?.total || 0}`,
      `"${(s.cascading_messages || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${room?.name || 'meeting'}-sessions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // A16: Export formatted text recap
  function exportRecap() {
    const lines: string[] = []
    lines.push(`=== ${room?.name || 'Meeting'} — Session History ===`)
    lines.push(`Exported: ${new Date().toLocaleDateString()}`)
    lines.push('')

    for (const s of filteredSessions) {
      lines.push(`─── ${formatDate(s.meeting_date)} ───`)
      if (s.rating) lines.push(`Rating: ${s.rating}/10`)
      if (s.todo_stats) lines.push(`To-Dos: ${s.todo_stats.completed}/${s.todo_stats.total} complete`)
      if (s.rock_stats) lines.push(`Rocks: ${s.rock_stats.onTrack} on track, ${s.rock_stats.offTrack} off track, ${s.rock_stats.done} done`)
      if (s.issue_stats) lines.push(`Issues: ${s.issue_stats.resolved}/${s.issue_stats.total} resolved`)
      if (s.cascading_messages) lines.push(`Cascading: ${s.cascading_messages}`)
      lines.push('')
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${room?.name || 'meeting'}-recap.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  // Average rating
  const avgRating = useMemo(() => {
    const rated = filteredSessions.filter(s => s.rating)
    if (rated.length === 0) return null
    return (rated.reduce((sum, s) => sum + (s.rating || 0), 0) / rated.length).toFixed(1)
  }, [filteredSessions])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-cult-dark border-l border-cult-border flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cult-border">
          <div className="flex items-center gap-3">
            <History size={16} className="text-cult-gold" />
            <h2 className="font-display text-lg tracking-widest text-cult-white">Session History</h2>
          </div>
          <button onClick={onClose} className="text-cult-text hover:text-cult-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* A15: Filters */}
        <div className="px-5 py-3 border-b border-cult-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Search size={12} className="text-cult-text/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cascading messages..."
              className="flex-1 bg-transparent text-xs text-cult-white placeholder:text-cult-text/25 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar size={10} className="text-cult-text/30" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-cult-surface border border-cult-border rounded px-2 py-1 text-[10px] text-cult-text font-mono focus:outline-none focus:border-cult-gold/30"
              />
              <span className="text-cult-text/20 text-[10px]">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-cult-surface border border-cult-border rounded px-2 py-1 text-[10px] text-cult-text font-mono focus:outline-none focus:border-cult-gold/30"
              />
            </div>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-cult-text/30" />
              <select
                value={minRating}
                onChange={e => setMinRating(e.target.value ? Number(e.target.value) : '')}
                className="bg-cult-surface border border-cult-border rounded px-2 py-1 text-[10px] text-cult-text font-mono focus:outline-none focus:border-cult-gold/30"
              >
                <option value="">Any rating</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}+ stars</option>
                ))}
              </select>
            </div>
            {(dateFrom || dateTo || minRating !== '' || searchQuery) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setMinRating(''); setSearchQuery('') }}
                className="text-[10px] text-cult-text/40 hover:text-cult-gold transition-colors font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-2 border-b border-cult-border/30 flex items-center gap-4">
          <span className="text-[10px] font-mono text-cult-text/40">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </span>
          {avgRating && (
            <span className="text-[10px] font-mono text-cult-gold/60">
              Avg rating: {avgRating}/10
            </span>
          )}
          <div className="flex-1" />
          {/* A16: Export buttons */}
          <button
            onClick={exportCSV}
            disabled={filteredSessions.length === 0}
            className="text-[10px] font-mono text-cult-text/40 hover:text-cult-gold transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <Download size={10} /> CSV
          </button>
          <button
            onClick={exportRecap}
            disabled={filteredSessions.length === 0}
            className="text-[10px] font-mono text-cult-text/40 hover:text-cult-gold transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <Download size={10} /> Recap
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="font-mono text-xs text-cult-text/40 tracking-[0.2em] animate-pulse">LOADING</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <History size={24} className="mx-auto text-cult-text/20 mb-2" />
              <p className="text-xs text-cult-text/40">
                {sessions.length === 0 ? 'No sessions recorded yet' : 'No sessions match your filters'}
              </p>
            </div>
          ) : (
            filteredSessions.map(session => {
              const expanded = expandedId === session.id

              return (
                <div
                  key={session.id}
                  className="rounded-lg border border-cult-border bg-cult-surface overflow-hidden transition-all duration-200"
                >
                  {/* Session header — clickable */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : session.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cult-muted/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-cult-white">
                          {formatDate(session.meeting_date)}
                        </span>
                        {session.rating && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            session.rating >= 8 ? 'bg-green-500/10 text-green-400' :
                            session.rating >= 5 ? 'bg-cult-gold/10 text-cult-gold' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {session.rating}/10
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {session.todo_stats && (
                          <span className="text-[10px] font-mono text-cult-text/40">
                            <ListTodo size={9} className="inline mr-0.5" />
                            {session.todo_stats.completed}/{session.todo_stats.total}
                          </span>
                        )}
                        {session.issue_stats && (
                          <span className="text-[10px] font-mono text-cult-text/40">
                            <MessageSquare size={9} className="inline mr-0.5" />
                            {session.issue_stats.resolved}/{session.issue_stats.total}
                          </span>
                        )}
                        {session.attendees && (
                          <span className="text-[10px] font-mono text-cult-text/40">
                            <Users size={9} className="inline mr-0.5" />
                            {session.attendees.length}
                          </span>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-cult-text/30" /> : <ChevronDown size={14} className="text-cult-text/30" />}
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-cult-border/50 space-y-3">
                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {session.rock_stats && (
                          <div className="text-center p-2 rounded bg-cult-dark">
                            <Target size={12} className="mx-auto mb-1 text-cult-gold/50" />
                            <div className="text-xs text-cult-white font-mono">{session.rock_stats.onTrack}</div>
                            <div className="text-[8px] text-cult-text/30 uppercase tracking-wider">On Track</div>
                          </div>
                        )}
                        {session.todo_stats && (
                          <div className="text-center p-2 rounded bg-cult-dark">
                            <ListTodo size={12} className="mx-auto mb-1 text-cult-gold/50" />
                            <div className="text-xs text-cult-white font-mono">
                              {session.todo_stats.completed}<span className="text-cult-text/30">/{session.todo_stats.total}</span>
                            </div>
                            <div className="text-[8px] text-cult-text/30 uppercase tracking-wider">Todos Done</div>
                          </div>
                        )}
                        {session.issue_stats && (
                          <div className="text-center p-2 rounded bg-cult-dark">
                            <MessageSquare size={12} className="mx-auto mb-1 text-cult-gold/50" />
                            <div className="text-xs text-cult-white font-mono">
                              {session.issue_stats.resolved}<span className="text-cult-text/30">/{session.issue_stats.total}</span>
                            </div>
                            <div className="text-[8px] text-cult-text/30 uppercase tracking-wider">Resolved</div>
                          </div>
                        )}
                      </div>

                      {/* Cascading messages */}
                      {session.cascading_messages && (
                        <div>
                          <div className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-1">Cascading</div>
                          <p className="text-xs text-cult-text leading-relaxed">{session.cascading_messages}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
