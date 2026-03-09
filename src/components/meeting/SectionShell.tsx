import { SECTIONS, SectionId } from '../../types/meeting'
import {
  Smile, BarChart3, Target, Newspaper,
  ListTodo, MessageSquare, CheckCircle2
} from 'lucide-react'

const SECTION_ICONS: Record<string, React.ElementType> = {
  Smile, BarChart3, Target, Newspaper,
  ListTodo, MessageSquare, CheckCircle2,
}

interface Props {
  sectionId: SectionId
}

export default function SectionShell({ sectionId }: Props) {
  const section = SECTIONS.find(s => s.id === sectionId)
  if (!section) return null

  const Icon = SECTION_ICONS[section.icon]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
      {/* Section icon + title */}
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-cult-gold/10 border border-cult-gold/20 flex items-center justify-center">
            <Icon size={24} className="text-cult-gold" />
          </div>
        )}
        <div>
          <h2 className="font-display text-3xl text-cult-white tracking-wider">{section.label.toUpperCase()}</h2>
          <div className="font-mono text-[10px] text-cult-gold/60 tracking-wider uppercase mt-0.5">
            {section.minutes} minutes
          </div>
        </div>
      </div>

      {/* Tip */}
      <p className="text-sm text-cult-text max-w-md text-center leading-relaxed mb-8">
        {section.tip}
      </p>

      {/* Placeholder content - will be replaced by actual section components in Phase 2 */}
      <div className="w-full max-w-2xl">
        <div className="border border-dashed border-cult-border rounded-lg p-8 text-center">
          <div className="font-mono text-xs text-cult-text/40 tracking-wider uppercase mb-2">
            Phase 2 — Coming Soon
          </div>
          <div className="text-sm text-cult-text/60">
            {sectionId === 'segue' && 'Share personal & professional good news with your team.'}
            {sectionId === 'scorecard' && 'Review weekly metrics — green means on track, red means action needed.'}
            {sectionId === 'rocks' && 'Check in on 90-day rocks: on track, off track, or done.'}
            {sectionId === 'headlines' && 'Share brief customer or employee news headlines.'}
            {sectionId === 'todos' && 'Review action items, mark complete, add notes.'}
            {sectionId === 'ids' && 'Identify, Discuss, Solve — work through your top issues.'}
            {sectionId === 'conclude' && 'Recap to-dos, share cascading messages, rate the meeting.'}
          </div>
        </div>
      </div>
    </div>
  )
}
