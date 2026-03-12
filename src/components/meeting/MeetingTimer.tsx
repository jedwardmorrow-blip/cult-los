import { useState, useEffect, useCallback, useRef } from 'react'
import { useMeeting } from '../../hooks/useMeetingRoom'
import { Play, Pause, RotateCcw, Settings } from 'lucide-react'

export default function MeetingTimer() {
  const { timer, startTimer, stopTimer, resetTimer, room, updateRoomDuration } = useMeeting()
  const [remaining, setRemaining] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [durationInput, setDurationInput] = useState('')
  const totalSecondsRef = useRef(0)

  useEffect(() => {
    if (!timer) {
      const secs = room?.timer_duration_minutes ? room.timer_duration_minutes * 60 : 90 * 60
      setRemaining(secs)
      totalSecondsRef.current = secs
      return
    }
    if (!timer.running) {
      setRemaining(timer.base_seconds || 0)
      return
    }
    // Track total duration for progress bar
    if (timer.expires_at && timer.base_seconds) {
      const totalFromExpiry = Math.floor((new Date(timer.expires_at).getTime() - Date.now()) / 1000) + (timer.base_seconds - remaining)
      if (totalSecondsRef.current === 0) totalSecondsRef.current = timer.base_seconds
    }
    function tick() {
      if (!timer?.expires_at) return
      const diff = Math.max(0, Math.floor((new Date(timer.expires_at).getTime() - Date.now()) / 1000))
      setRemaining(diff)
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [timer, room])

  const isRunning = timer?.running ?? false
  const isExpired = isRunning && remaining <= 0
  const hours = Math.floor(remaining / 3600)
  const mins = Math.floor((remaining % 3600) / 60)
  const secs = remaining % 60
  const formatted = hours > 0
    ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // A4: Gradient color based on % remaining
  const total = totalSecondsRef.current || remaining || 1
  const pct = remaining / total
  const timerColor = isExpired
    ? 'text-cult-red-bright animate-pulse'
    : pct < 0.05 && isRunning
      ? 'text-cult-red-bright'
      : pct < 0.15 && isRunning
        ? 'text-cult-amber-bright'
        : pct < 0.35 && isRunning
          ? 'text-cult-gold'
          : isRunning
            ? 'text-cult-green-bright'
            : 'text-cult-text'

  // A5: Progress bar color
  const barColor = isExpired
    ? 'bg-cult-red-bright'
    : pct < 0.05
      ? 'bg-cult-red-bright'
      : pct < 0.15
        ? 'bg-cult-amber-bright'
        : pct < 0.35
          ? 'bg-cult-gold'
          : 'bg-cult-green-bright'

  const handleToggle = useCallback(() => {
    if (isRunning) { stopTimer() }
    else {
      const startSecs = remaining > 0 ? remaining : (room?.timer_duration_minutes || 90) * 60
      totalSecondsRef.current = startSecs
      startTimer(startSecs)
    }
  }, [isRunning, remaining, room, startTimer, stopTimer])

  const handleReset = useCallback(() => { resetTimer() }, [resetTimer])

  const handlePreset = (minutes: number) => {
    totalSecondsRef.current = minutes * 60
    startTimer(minutes * 60)
    setShowSettings(false)
  }

  const handleCustomStart = () => {
    const m = parseInt(customMinutes)
    if (m > 0) {
      totalSecondsRef.current = m * 60
      startTimer(m * 60)
      setCustomMinutes('')
      setShowSettings(false)
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault(); handleToggle()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleToggle])

  return (
    <div className="relative flex items-center gap-2">
      {/* A5: Progress bar */}
      {isRunning && (
        <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-cult-border rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 ease-linear rounded-full`}
            style={{ width: `${Math.min(100, pct * 100)}%` }}
          />
        </div>
      )}

      <div className={`font-mono text-sm tracking-wider tabular-nums ${timerColor}`}>
        {isExpired ? '00:00' : formatted}
      </div>
      <button onClick={handleToggle} className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isRunning ? 'bg-cult-gold/20 text-cult-gold hover:bg-cult-gold/30' : 'bg-cult-muted text-cult-text hover:text-cult-white hover:bg-cult-border'}`} title={isRunning ? 'Pause (Space)' : 'Start (Space)'}>{isRunning ? <Pause size={12} /> : <Play size={12} />}</button>
      <button onClick={handleReset} className="w-7 h-7 rounded-md flex items-center justify-center bg-cult-muted text-cult-text hover:text-cult-white hover:bg-cult-border transition-colors" title="Reset timer"><RotateCcw size={12} /></button>
      <button onClick={() => setShowSettings(!showSettings)} className="w-7 h-7 rounded-md flex items-center justify-center bg-cult-muted text-cult-text hover:text-cult-white hover:bg-cult-border transition-colors" title="Timer presets"><Settings size={12} /></button>
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-cult-card border border-cult-border rounded-lg shadow-xl z-50 p-3 space-y-3 animate-fade-in">
          <div className="text-[10px] font-mono text-cult-text/60 tracking-wider uppercase">Quick Start</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[30, 45, 60, 75, 90, 120].map(m => (
              <button key={m} onClick={() => handlePreset(m)} className="px-2 py-1.5 rounded-md bg-cult-muted text-cult-text text-xs font-mono hover:bg-cult-border hover:text-cult-white transition-colors">{m}m</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input className="input-field text-xs flex-1 py-1.5" placeholder="Custom min" type="number" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomStart()} />
            <button onClick={handleCustomStart} className="btn-primary text-xs px-3 py-1.5">Go</button>
          </div>
          <div className="border-t border-cult-border pt-3">
            <div className="text-[10px] font-mono text-cult-text/60 tracking-wider uppercase mb-2">Room Default ({room?.timer_duration_minutes || 90}m)</div>
            <div className="flex gap-1.5">
              <input
                className="input-field text-xs flex-1 py-1.5"
                placeholder={String(room?.timer_duration_minutes || 90)}
                type="number"
                min={5}
                max={300}
                value={durationInput}
                onChange={e => setDurationInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const m = parseInt(durationInput)
                    if (m >= 5 && m <= 300) {
                      updateRoomDuration(m)
                      setDurationInput('')
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const m = parseInt(durationInput)
                  if (m >= 5 && m <= 300) {
                    updateRoomDuration(m)
                    setDurationInput('')
                  }
                }}
                className="btn-ghost text-xs px-3 py-1.5 border border-cult-border"
              >Save</button>
            </div>
            <p className="text-[9px] text-cult-text/40 mt-1.5 font-mono">Sets the default meeting length for this room</p>
          </div>
        </div>
      )}
    </div>
  )
}
