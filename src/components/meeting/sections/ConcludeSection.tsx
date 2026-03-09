import { CheckCircle2 } from 'lucide-react'

export default function ConcludeSection() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Recap to-dos, cascade messages, rate the meeting
        </p>
      </div>

      <div className="border border-dashed border-cult-border rounded-lg p-12 text-center">
        <CheckCircle2 size={32} className="mx-auto text-cult-text/20 mb-3" />
        <div className="font-mono text-xs text-cult-text/40 tracking-wider uppercase mb-2">
          Phase 4 — Coming Soon
        </div>
        <p className="text-sm text-cult-text/50 max-w-md mx-auto">
          Conclude will show a recap of all to-dos created, let you share cascading messages,
          rate the meeting 1–10, and save meeting notes.
        </p>
      </div>
    </div>
  )
}