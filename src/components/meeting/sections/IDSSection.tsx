import { MessageSquare } from 'lucide-react'

export default function IDSSection() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Identify, Discuss, Solve — work through the top issues until solved
        </p>
      </div>

      <div className="border border-dashed border-cult-border rounded-lg p-12 text-center">
        <MessageSquare size={32} className="mx-auto text-cult-text/20 mb-3" />
        <div className="font-mono text-xs text-cult-text/40 tracking-wider uppercase mb-2">
          Phase 3 — Coming Soon
        </div>
        <p className="text-sm text-cult-text/50 max-w-md mx-auto">
          The IDS engine will let you drag issues from the issues list, discuss them one at a time,
          and mark them solved — with to-do creation built in.
        </p>
      </div>
    </div>
  )
}