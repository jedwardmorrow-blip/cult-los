import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMeeting } from '../../hooks/useMeetingRoom'
import { SECTIONS, SectionId } from '../../types/meeting'
import MeetingTimer from './MeetingTimer'
import MeetingSidebar from './MeetingSidebar'
import SectionShell from './SectionShell'
import {
  Smile, BarChart3, Target, Newspaper, ListTodo,
  MessageSquare, CheckCircle2, ArrowLeft, Settings
} from 'lucide-react'

const SECTION_ICONS: Record<string, any> = {
  segue: Smile,
  scorecard: BarChart3,
  rocks: Target,
  headlines: Newspaper,
  todos: ListTodo,
  ids: MessageSquare,
  conclude: CheckCircle2,
}

export default function MeetingRoom() {
  const navigate = useNavigate()
  const { room, currentSection, setCurrentSection, loading } = useMeeting()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      const idx = SECTIONS.findIndex(s => s.id === currentSection)
      if (e.key === 'ArrowRight' && idx < SECTIONS.length - 1) {
        e.preventDefault()
        setCurrentSection(SECTIONS[idx + 1].id)
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault()
        setCurrentSection(SECTIONS[idx - 1].id)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSection, setCurrentSection])

  if (loading) {
    return (
      <div className="h-full bg-cult-black flex items-center justify-center">
        <div className="font-mono text-xs text-cult-text tracking-[0.4em] animate-pulse">ENTERING ROOM</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="h-full bg-cult-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-cult-text text-sm mb-4">Room not found.</p>
          <button onClick={() => navigate('/rooms')} className="btn-ghost">Back to Rooms</button>
        </div>
      </div>
    )
  }

  const currentSectionData = SECTIONS.find(s => s.id === currentSection)!
  const currentIdx = SECTIONS.findIndex(s => s.id === currentSection)

  return (
    <div className="flex h-full bg-cult-black overflow-hidden">
      <MeetingSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 border-b border-cult-border bg-cult-dark px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/rooms')} className="text-cult-text hover:text-cult-white transition-colors" title="Back to rooms">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="font-display text-lg tracking-widest text-cult-white leading-none">{room.name}</h1>
                <p className="text-[10px] font-mono text-cult-text mt-0.5 tracking-wider uppercase">
                  {currentSectionData.label} — {currentSectionData.tip}
                </p>
              </div>
            </div>
            <MeetingTimer />
          </div>
        </header>
        <nav className="flex-shrink-0 border-b border-cult-border bg-cult-dark/50 px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((section, idx) => {
              const Icon = SECTION_ICONS[section.id]
              const active = section.id === currentSection
              const completed = idx < currentIdx
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150',
                    active
                      ? 'bg-cult-gold/15 text-cult-gold border border-cult-gold/30'
                      : completed
                        ? 'text-cult-gold/60 hover:text-cult-gold hover:bg-cult-gold/5'
                        : 'text-cult-text hover:text-cult-white hover:bg-cult-muted'
                  ].join(' ')}
                  title={section.label + ' (' + section.minutes + 'm)'}
                >
                  <Icon size={14} />
                  <span>{section.label}</span>
                  <span className={'font-mono text-[10px] ' + (active ? 'text-cult-gold/70' : 'text-cult-text/50')}>
                    {section.minutes}m
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
        <div className="flex-1 overflow-y-auto p-6">
          <SectionShell sectionId={currentSection} />
        </div>
        <footer className="flex-shrink-0 border-t border-cult-border bg-cult-dark px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentIdx > 0 && setCurrentSection(SECTIONS[currentIdx - 1].id)}
              disabled={currentIdx === 0}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {currentIdx > 0 ? '\u2190 ' + SECTIONS[currentIdx - 1].label : '\u2190'}
            </button>
            <div className="flex items-center gap-1.5">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.id}
                  className={'w-2 h-2 rounded-full transition-colors ' + (
                    i === currentIdx ? 'bg-cult-gold' :
                    i < currentIdx ? 'bg-cult-gold/40' : 'bg-cult-muted'
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => currentIdx < SECTIONS.length - 1 && setCurrentSection(SECTIONS[currentIdx + 1].id)}
              disabled={currentIdx === SECTIONS.length - 1}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {currentIdx < SECTIONS.length - 1 ? SECTIONS[currentIdx + 1].label + ' \u2192' : '\u2192'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
