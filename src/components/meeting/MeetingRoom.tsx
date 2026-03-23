import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMeeting } from '../../hooks/useMeetingRoom'
import { SECTIONS, SectionId } from '../../types/meeting'
import MeetingTimer from './MeetingTimer'
import MeetingSidebar from './MeetingSidebar'
import SectionShell from './SectionShell'
import FloatingTodoPanel from './FloatingTodoPanel'
import SessionHistoryPanel from './SessionHistoryPanel'
import {
  Smile, BarChart3, Target, Newspaper, ListTodo,
  MessageSquare, CheckCircle2, ArrowLeft, Menu, History, RotateCcw,
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
  const { room, currentSection, setCurrentSection, loading, resetMeeting, meetingStartedAt, startMeeting, presence } = useMeeting()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  // Auto-open sidebar on desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setSidebarOpen(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Keyboard shortcuts: arrow keys + number keys 1-7
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const idx = SECTIONS.findIndex(s => s.id === currentSection)

      // Arrow nav
      if (e.key === 'ArrowRight' && idx < SECTIONS.length - 1) {
        e.preventDefault()
        setCurrentSection(SECTIONS[idx + 1].id)
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault()
        setCurrentSection(SECTIONS[idx - 1].id)
      }

      // Number keys 1-7 jump to section
      const num = parseInt(e.key)
      if (num >= 1 && num <= SECTIONS.length) {
        e.preventDefault()
        setCurrentSection(SECTIONS[num - 1].id)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSection, setCurrentSection])

  // Close sidebar on mobile when section changes
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [currentSection])

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed md:static z-40 md:z-auto h-full transition-transform duration-200 ease-out
        ${!sidebarOpen ? 'md:w-12' : ''}
      `}>
        <MeetingSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 border-b border-cult-border bg-cult-dark px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-cult-text hover:text-cult-white transition-colors md:hidden flex-shrink-0"
              >
                <Menu size={18} />
              </button>
              <button
                onClick={() => navigate('/rooms')}
                className="text-cult-text hover:text-cult-white transition-colors flex-shrink-0 hidden sm:block"
                title="Back to rooms"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-lg tracking-widest text-cult-white leading-none truncate">{room.name}</h1>
                <p className="text-[10px] font-mono text-cult-text mt-0.5 tracking-wider uppercase truncate hidden sm:block">
                  {currentSectionData.label} — {currentSectionData.tip}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryOpen(true)}
                className="text-cult-text hover:text-cult-gold transition-colors p-1.5 rounded hover:bg-cult-gold/5"
                title="Session History"
              >
                <History size={16} />
              </button>
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="text-cult-text hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/5"
                title="Reset Meeting"
              >
                <RotateCcw size={16} />
              </button>
              <MeetingTimer />
            </div>
          </div>
        </header>

        {/* Section tabs */}
        <nav className="flex-shrink-0 border-b border-cult-border bg-cult-dark/50 px-2 sm:px-6">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto py-2 scrollbar-hide">
            {SECTIONS.map((section, idx) => {
              const Icon = SECTION_ICONS[section.id]
              const active = section.id === currentSection
              const completed = idx < currentIdx

              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0
                    ${active
                      ? 'bg-cult-gold/15 text-cult-gold border border-cult-gold/30'
                      : completed
                        ? 'text-cult-gold/60 hover:text-cult-gold hover:bg-cult-gold/5'
                        : 'text-cult-text hover:text-cult-white hover:bg-cult-muted'
                    }
                  `}
                  title={`${section.label} (${section.minutes}m)\n${section.tip}\nPress ${idx + 1}`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{section.label}</span>
                  <span className={`font-mono text-[10px] hidden lg:inline ${active ? 'text-cult-gold/70' : 'text-cult-text/50'}`}>
                    {section.minutes}m
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Section content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Meeting start ceremony — shown when meeting hasn't started */}
          {!meetingStartedAt && (
            <div className="max-w-md mx-auto text-center py-8 mb-6 animate-fade-in">
              <div className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-4">
                {presence.length} {presence.length === 1 ? 'person' : 'people'} in the room
              </div>
              <button
                onClick={startMeeting}
                className="px-8 py-3 rounded-lg bg-cult-gold text-cult-black font-display text-lg tracking-widest hover:bg-cult-gold/90 transition-colors shadow-[0_0_24px_rgba(200,168,75,0.2)]"
              >
                START MEETING
              </button>
              <p className="text-[10px] font-mono text-cult-text/30 mt-3 tracking-wider">
                Starts a 5-minute Segue timer and syncs all participants
              </p>
            </div>
          )}
          <SectionShell sectionId={currentSection} />
        </div>

        {/* Floating todo panel */}
        <FloatingTodoPanel />

        {/* Bottom nav: prev/next */}
        <footer className="flex-shrink-0 border-t border-cult-border bg-cult-dark px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentIdx > 0 && setCurrentSection(SECTIONS[currentIdx - 1].id)}
              disabled={currentIdx === 0}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← <span className="hidden sm:inline">{currentIdx > 0 ? SECTIONS[currentIdx - 1].label : ''}</span>
            </button>
            <div className="flex items-center gap-1.5">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSection(s.id)}
                  className={`w-2 h-2 rounded-full transition-colors hover:scale-125 ${
                    i === currentIdx ? 'bg-cult-gold' :
                    i < currentIdx ? 'bg-cult-gold/40' : 'bg-cult-muted'
                  }`}
                  title={s.label}
                />
              ))}
            </div>
            <button
              onClick={() => currentIdx < SECTIONS.length - 1 && setCurrentSection(SECTIONS[currentIdx + 1].id)}
              disabled={currentIdx === SECTIONS.length - 1}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">{currentIdx < SECTIONS.length - 1 ? SECTIONS[currentIdx + 1].label : ''}</span> →
            </button>
          </div>
        </footer>
      </div>
      {/* Session history panel */}
      <SessionHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* A17: Reset meeting confirmation modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setResetConfirmOpen(false)} />
          <div className="relative bg-cult-dark border border-cult-border rounded-xl p-6 max-w-sm w-full mx-4 animate-fade-in">
            <h3 className="font-display text-lg tracking-widest text-cult-white mb-2">Reset Meeting?</h3>
            <p className="text-sm text-cult-text mb-1">This will clear:</p>
            <ul className="text-xs text-cult-text/60 space-y-1 mb-5 ml-3">
              <li>• All segue entries</li>
              <li>• All headlines</li>
              <li>• Cascading messages & rating</li>
              <li>• Timer (reset to default)</li>
              <li>• Return to Segue section</li>
            </ul>
            <p className="text-[10px] font-mono text-cult-text/40 mb-4">
              Rocks, to-dos, issues, and scorecard data will not be affected.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetMeeting()
                  setResetConfirmOpen(false)
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              >
                Reset Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
