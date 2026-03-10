import { useState } from 'react'
import { X, Calendar, Clock, Repeat, Download } from 'lucide-react'
import type { MeetingRoom } from '../../types/meeting'
import { downloadICS } from '../../lib/ics'

interface Props {
  room: MeetingRoom
  onSchedule: (params: {
    room_id: string
    title: string
    scheduled_at: string
    duration_minutes: number
    recurrence: 'none' | 'weekly' | 'biweekly' | 'monthly'
  }) => Promise<unknown>
  onClose: () => void
}

export default function ScheduleMeetingModal({ room, onSchedule, onClose }: Props) {
  const [title, setTitle] = useState(`L-10: ${room.name}`)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(room.timer_duration_minutes || 90)
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time) return

    setSaving(true)
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

    await onSchedule({
      room_id: room.id,
      title,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      recurrence,
    })

    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-cult-surface border border-cult-border rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cult-border">
          <div>
            <h2 className="font-display text-lg text-cult-white tracking-wide">Schedule Meeting</h2>
            <p className="text-[10px] font-mono text-cult-text mt-0.5">{room.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-cult-muted rounded transition-colors">
            <X size={16} className="text-cult-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-mono text-cult-text uppercase tracking-wider block mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-cult-text uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Calendar size={10} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-cult-text uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Clock size={10} /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] font-mono text-cult-text uppercase tracking-wider block mb-1.5">
              Duration (minutes)
            </label>
            <div className="flex gap-2">
              {[60, 90, 120].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    duration === d
                      ? 'bg-cult-gold/20 text-cult-gold border border-cult-gold/30'
                      : 'bg-cult-dark text-cult-text border border-cult-border hover:text-cult-white'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-[10px] font-mono text-cult-text uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Repeat size={10} /> Recurrence
            </label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'none', label: 'Once' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
              ] as const).map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecurrence(r.value)}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    recurrence === r.value
                      ? 'bg-cult-gold/20 text-cult-gold border border-cult-gold/30'
                      : 'bg-cult-dark text-cult-text border border-cult-border hover:text-cult-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* G5: ICS download fallback */}
            <button
              type="button"
              disabled={!date || !time}
              onClick={() => {
                if (!date || !time) return
                downloadICS({
                  title,
                  scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
                  durationMinutes: duration,
                  description: `${room.name} — L10 Meeting`,
                })
              }}
              className="flex items-center gap-1 text-[10px] font-mono text-cult-text/50 hover:text-cult-text transition-colors disabled:opacity-30"
              title="Download .ics file for non-Google calendars"
            >
              <Download size={10} /> .ics
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !date || !time}
                className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
