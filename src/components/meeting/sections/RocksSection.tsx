import { useMeeting } from '../../../hooks/useMeetingRoom'
import { Target, ChevronRight } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  on_track: { label: 'On Track', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  off_track: { label: 'Off Track', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  complete: { label: 'Complete', color: 'text-cult-gold', bg: 'bg-cult-gold/10 border-cult-gold/30' },
}

export default function RocksSection() {
  const { rocks, cycleRockStatus } = useMeeting()

  if (rocks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center py-12">
          <Target size={32} className="mx-auto text-cult-text/30 mb-3" />
          <p className="text-sm text-cult-text/60 mb-1">No rocks for this quarter</p>
          <p className="text-xs text-cult-text/40">Add 90-day rocks in room settings to track here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3 animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Review 90-day rocks: on track, off track, or done
        </p>
      </div>

      {rocks.map(rock => {
        const config = STATUS_CONFIG[rock.status] || STATUS_CONFIG.on_track

        return (
          <div
            key={rock.id}
            className="rounded-lg border border-cult-border bg-cult-surface hover:bg-cult-surface/80 transition-all duration-200"
          >
            <div className="flex items-center gap-4 px-4 py-3">
              {/* Status badge — clickable to cycle */}
              <button
                onClick={() => cycleRockStatus(rock.id, rock.status)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-md border text-[10px] font-mono tracking-wider uppercase
                  transition-all duration-150 hover:scale-105 cursor-pointer
                  ${config.bg} ${config.color}
                `}
                title="Click to cycle status"
              >
                {config.label}
              </button>

              {/* Rock info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-cult-white truncate">{rock.title}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-cult-text/50 font-mono">
                    {rock.profiles?.full_name || 'Unassigned'}
                  </span>
                  {rock.due_date && (
                    <span className="text-[10px] text-cult-text/40 font-mono">
                      Due {new Date(rock.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron indicator */}
              <ChevronRight size={14} className="text-cult-text/20 flex-shrink-0" />
            </div>

            {/* Description if present */}
            {rock.description && (
              <div className="px-4 pb-3 border-t border-cult-border/30">
                <p className="text-xs text-cult-text/60 mt-2 leading-relaxed">{rock.description}</p>
              </div>
            )}
          </div>
        )
      })}

      {/* Summary bar */}
      <div className="flex items-center justify-center gap-6 pt-4">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = rocks.filter(r => r.status === status).length
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
              <span className="text-[10px] font-mono text-cult-text/50">
                {count} {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}