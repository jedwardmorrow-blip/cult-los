import { useState, useMemo } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../ui/Toast'
import { BarChart3, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react'

export default function ScorecardSection() {
  const { user } = useAuth()
  const { scorecardMetrics, scorecardEntries, addScorecardEntry } = useMeeting()
  const { showToast } = useToast()
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [cellValue, setCellValue] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')

  // Generate last 4 week-start dates (Monday-based)
  const weeks = useMemo(() => {
    const result: string[] = []
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    monday.setHours(0, 0, 0, 0)

    for (let i = 0; i < 4; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() - i * 7)
      result.push(d.toISOString().split('T')[0])
    }
    return result
  }, [])

  function getEntry(metricId: string, weekStart: string) {
    return scorecardEntries.find(
      e => e.metric_id === metricId && e.week_start === weekStart
    )
  }

  function getCellKey(metricId: string, weekStart: string) {
    return `${metricId}:${weekStart}`
  }

  function startEdit(metricId: string, weekStart: string) {
    const entry = getEntry(metricId, weekStart)
    setCellValue(entry?.value?.toString() || '')
    setEditingCell(getCellKey(metricId, weekStart))
  }

  async function saveCell(metricId: string, weekStart: string) {
    const val = parseFloat(cellValue)
    if (!isNaN(val)) {
      await addScorecardEntry(metricId, weekStart, val)
      showToast('Entry saved', 'success')
    }
    setEditingCell(null)
  }

  // A7: Trend arrow for a metric based on last 2 weeks
  function getTrend(metricId: string): 'up' | 'down' | 'flat' | null {
    if (weeks.length < 2) return null
    const current = getEntry(metricId, weeks[0])?.value
    const prev = getEntry(metricId, weeks[1])?.value
    if (current == null || prev == null) return null
    if (current > prev) return 'up'
    if (current < prev) return 'down'
    return 'flat'
  }

  function formatWeek(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (scorecardMetrics.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <BarChart3 size={32} className="mx-auto text-cult-text/30 mb-3" />
          <p className="text-sm text-cult-text/60 mb-1">No scorecard metrics configured</p>
          <p className="text-xs text-cult-text/40">Add metrics in room settings to track weekly KPIs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Review weekly metrics — green means on track, red means action needed
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cult-border">
              <th className="text-left py-2 px-2 sm:px-3 text-[10px] font-mono text-cult-text/50 tracking-wider uppercase w-1/4">Metric</th>
              <th className="text-center py-2 px-2 sm:px-3 text-[10px] font-mono text-cult-text/50 tracking-wider uppercase w-16 hidden sm:table-cell">Trend</th>
              <th className="text-center py-2 px-2 sm:px-3 text-[10px] font-mono text-cult-text/50 tracking-wider uppercase w-20 hidden md:table-cell">Goal</th>
              <th className="text-left py-2 px-2 sm:px-3 text-[10px] font-mono text-cult-text/50 tracking-wider uppercase w-28 hidden lg:table-cell">Owner</th>
              {weeks.map(w => (
                <th key={w} className="text-center py-2 px-3 text-[10px] font-mono text-cult-text/50 tracking-wider uppercase w-24">
                  {formatWeek(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scorecardMetrics.map(metric => {
              // A7: Trend
              const trend = getTrend(metric.id)

              return (
                <tr key={metric.id} className="border-b border-cult-border/50 hover:bg-cult-surface/50 transition-colors">
                  <td className="py-3 px-2 sm:px-3">
                    <div className="text-cult-white font-medium text-xs sm:text-sm">{metric.title}</div>
                    {metric.unit && (
                      <div className="text-[10px] text-cult-text/40 font-mono">{metric.unit}</div>
                    )}
                  </td>
                  {/* A7: Trend arrow column */}
                  <td className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">
                    {trend === 'up' && <TrendingUp size={14} className="mx-auto text-green-400" />}
                    {trend === 'down' && <TrendingDown size={14} className="mx-auto text-red-400" />}
                    {trend === 'flat' && <Minus size={14} className="mx-auto text-cult-text/30" />}
                    {trend === null && <span className="text-cult-text/15 text-xs">—</span>}
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">
                    <span className="font-mono text-cult-gold text-xs">
                      {metric.goal_value != null ? metric.goal_value : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-3 hidden lg:table-cell">
                    <span className="text-xs text-cult-text">{metric.profiles?.full_name || '—'}</span>
                  </td>
                  {weeks.map(weekStart => {
                    const entry = getEntry(metric.id, weekStart)
                    const key = getCellKey(metric.id, weekStart)
                    const isEditing = editingCell === key
                    const isEditingNote_ = editingNote === key
                    const value = entry?.value
                    const goal = metric.goal_value
                    const notes = entry?.notes

                    let statusColor = 'text-cult-text/50'
                    let bgColor = ''
                    if (value != null && goal != null) {
                      if (value >= goal) {
                        statusColor = 'text-green-400'
                        bgColor = 'bg-green-500/5'
                      } else {
                        statusColor = 'text-red-400'
                        bgColor = 'bg-red-500/5'
                      }
                    }

                    return (
                      <td key={weekStart} className={`py-3 px-3 text-center relative group ${bgColor}`}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={cellValue}
                            onChange={e => setCellValue(e.target.value)}
                            onBlur={() => saveCell(metric.id, weekStart)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveCell(metric.id, weekStart)
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className="w-16 bg-cult-dark border border-cult-gold/40 rounded px-2 py-1 text-center text-xs text-cult-white font-mono focus:outline-none focus:border-cult-gold"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(metric.id, weekStart)}
                              className={`font-mono text-xs cursor-pointer hover:text-cult-gold transition-colors ${statusColor}`}
                              title="Click to enter value"
                            >
                              {value != null ? value : '·'}
                            </button>
                            {/* A8: Note indicator */}
                            {notes && (
                              <span className="text-cult-gold/40" title={notes}>
                                <MessageSquare size={9} />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
