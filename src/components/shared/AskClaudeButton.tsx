// E2: Floating "Ask Claude" button that opens recommendations filtered by context
import { useState } from 'react'
import { Brain, X, Sparkles } from 'lucide-react'
import ClaudeRecommendations from '../ClaudeRecommendations'

interface Props {
  context?: string // e.g. 'todos', 'issues', 'rocks', 'checklist'
}

export default function AskClaudeButton({ context }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono
          bg-purple-900/20 border border-purple-700/30 text-purple-400
          hover:bg-purple-900/30 hover:text-purple-300 transition-colors"
        title="Get AI recommendations"
      >
        <Sparkles size={13} />
        Ask Claude
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-cult-dark border border-purple-900/30 border-b-0 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                <span className="font-mono text-xs text-purple-400 tracking-wider uppercase">
                  Claude Insights{context ? ` · ${context}` : ''}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-cult-text hover:text-cult-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="bg-cult-dark border border-purple-900/30 border-t-0 rounded-b-lg overflow-hidden">
              <ClaudeRecommendations maxItems={5} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
