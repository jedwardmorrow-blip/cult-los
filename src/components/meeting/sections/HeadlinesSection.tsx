import { useState } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { Newspaper, Plus, Check, X, ArrowDownToLine } from 'lucide-react'

export default function HeadlinesSection() {
  const { user } = useAuth()
  const { headlines, members, addHeadline, toggleHeadline, removeHeadline, dropHeadlineToIDS } = useMeeting()
  const [newText, setNewText] = useState('')

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    await addHeadline(text)
    setNewText('')
  }

  function getMemberName(profileId: string) {
    const member = members.find(m => m.profile_id === profileId)
    return member?.profiles?.full_name || 'Unknown'
  }

  const activeHeadlines = headlines.filter(h => !h.is_done && !h.dropped_to_ids)
  const completedHeadlines = headlines.filter(h => h.is_done || h.dropped_to_ids)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Brief customer or employee news — headlines, not stories
        </p>
      </div>

      {/* Add headline input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a headline..."
          className="input-field flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="btn-gold text-xs flex items-center gap-1.5 disabled:opacity-30"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Active headlines */}
      {activeHeadlines.length === 0 ? (
        <div className="text-center py-8">
          <Newspaper size={24} className="mx-auto text-cult-text/20 mb-2" />
          <p className="text-xs text-cult-text/40">No headlines yet — add customer or employee news above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeHeadlines.map(headline => (
            <div
              key={headline.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-cult-border bg-cult-surface hover:bg-cult-surface/80 transition-colors group"
            >
              {/* Check button */}
              <button
                onClick={() => toggleHeadline(headline.id, true)}
                className="flex-shrink-0 w-5 h-5 rounded border border-cult-border hover:border-cult-gold/50 flex items-center justify-center transition-colors"
                title="Mark as discussed"
              >
                <Check size={10} className="text-cult-text/30 group-hover:text-cult-gold" />
              </button>

              {/* Headline text + author */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cult-white">{headline.text}</p>
                <span className="text-[10px] font-mono text-cult-text/40">
                  {getMemberName(headline.profile_id)}
                </span>
              </div>

              {/* Actions — always visible */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => dropHeadlineToIDS(headline)}
                  className="p-1.5 rounded hover:bg-cult-gold/10 text-cult-text/30 hover:text-cult-gold transition-colors"
                  title="Drop to IDS"
                >
                  <ArrowDownToLine size={14} />
                </button>
                <button
                  onClick={() => removeHeadline(headline.id)}
                  className="p-1.5 rounded hover:bg-red-500/10 text-cult-text/30 hover:text-red-400 transition-colors"
                  title="Delete headline"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed / Dropped headlines */}
      {completedHeadlines.length > 0 && (
        <div className="mt-6">
          <div className="text-[10px] font-mono text-cult-text/30 tracking-wider uppercase mb-2">
            Discussed ({completedHeadlines.length})
          </div>
          <div className="space-y-1">
            {completedHeadlines.map(headline => (
              <div
                key={headline.id}
                className="flex items-center gap-3 px-4 py-2 rounded-lg opacity-50"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded bg-cult-gold/20 flex items-center justify-center">
                  <Check size={10} className="text-cult-gold" />
                </div>
                <p className="text-xs text-cult-text line-through flex-1">{headline.text}</p>
                {headline.dropped_to_ids && (
                  <span className="text-[9px] font-mono text-cult-gold/60 tracking-wider uppercase">→ IDS</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}