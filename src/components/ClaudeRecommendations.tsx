import { useState } from 'react'
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Code2,
  Wrench,
  Layout,
  TestTube,
  X,
  CheckCheck,
  AlertTriangle,
  ArrowUpCircle,
  Minus,
  ChevronUp,
} from 'lucide-react'
import { useClaudeRecommendations } from '../hooks/useClaudeRecommendations'
import type { ClaudeRecommendation } from '../types'

const PRIORITY_CONFIG: Record<string, { cls: string; label: string; icon: typeof AlertTriangle }> = {
  critical: { cls: 'text-cult-red-bright bg-cult-red-bright/10 border-cult-red-bright/30', label: 'CRITICAL', icon: AlertTriangle },
  high: { cls: 'text-cult-amber-bright bg-cult-amber-bright/10 border-cult-amber-bright/30', label: 'HIGH', icon: ArrowUpCircle },
  medium: { cls: 'text-cult-text bg-cult-muted border-cult-border', label: 'MED', icon: Minus },
  low: { cls: 'text-cult-text/60 bg-cult-dark border-cult-border/50', label: 'LOW', icon: ChevronDown },
}

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  security: Shield,
  operations: Wrench,
  tech_debt: Code2,
  testing: TestTube,
  frontend: Layout,
  feature: Zap,
}

interface Props {
  maxItems?: number
  compact?: boolean
}

export default function ClaudeRecommendations({ maxItems, compact = false }: Props) {
  const { recommendations, loading, dismissRecommendation, markActedOn } = useClaudeRecommendations()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-purple-400 animate-pulse" />
          <span className="font-mono text-[10px] text-cult-text tracking-wider animate-pulse">
            LOADING RECOMMENDATIONS...
          </span>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  const displayed = maxItems ? recommendations.slice(0, maxItems) : recommendations
  const criticalCount = recommendations.filter(r => r.priority_level === 'critical').length
  const highCount = recommendations.filter(r => r.priority_level === 'high').length

  return (
    <div className="card overflow-hidden border-purple-900/30 bg-purple-950/5">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-cult-dark/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-purple-900/30 flex items-center justify-center">
            <Brain size={14} className="text-purple-400" />
          </div>
          <div className="text-left">
            <div className="font-mono text-[10px] tracking-[0.2em] text-purple-400/70 uppercase">
              Claude Recommendations
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[9px] text-cult-text">
                {recommendations.length} active
              </span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.5 text-[8px] font-mono tracking-wider rounded-sm border text-cult-red-bright bg-cult-red-bright/10 border-cult-red-bright/30">
                  {criticalCount} CRITICAL
                </span>
              )}
              {highCount > 0 && (
                <span className="px-1.5 py-0.5 text-[8px] font-mono tracking-wider rounded-sm border text-cult-amber-bright bg-cult-amber-bright/10 border-cult-amber-bright/30">
                  {highCount} HIGH
                </span>
              )}
            </div>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown size={14} className="text-cult-text" />
        ) : (
          <ChevronUp size={14} className="text-cult-text" />
        )}
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-cult-border/50">
          {displayed.map((rec) => (
            <RecommendationRow
              key={rec.id}
              rec={rec}
              expanded={expandedId === rec.id}
              onToggle={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              onDismiss={() => dismissRecommendation(rec.id)}
              onActedOn={() => markActedOn(rec.id)}
              compact={compact}
            />
          ))}
          {maxItems && recommendations.length > maxItems && (
            <div className="px-5 py-2 border-t border-cult-border/30">
              <span className="font-mono text-[9px] text-purple-400/60">
                +{recommendations.length - maxItems} more recommendations
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RecommendationRow({
  rec,
  expanded,
  onToggle,
  onDismiss,
  onActedOn,
  compact,
}: {
  rec: ClaudeRecommendation
  expanded: boolean
  onToggle: () => void
  onDismiss: () => void
  onActedOn: () => void
  compact: boolean
}) {
  const priority = PRIORITY_CONFIG[rec.priority_level] || PRIORITY_CONFIG.medium
  const CategoryIcon = CATEGORY_ICONS[rec.category || ''] || Zap

  return (
    <div className="border-b border-cult-border/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-cult-dark/30 transition-colors text-left"
      >
        <CategoryIcon size={13} className="text-purple-400/60 flex-shrink-0" />
        <span className="text-xs text-cult-white flex-1 truncate">{rec.title}</span>
        <span className={`px-1.5 py-0.5 text-[8px] font-mono tracking-wider rounded-sm border flex-shrink-0 ${priority.cls}`}>
          {priority.label}
        </span>
        {rec.category && (
          <span className="font-mono text-[9px] text-cult-text/50 uppercase flex-shrink-0 hidden sm:inline">
            {rec.category.replace('_', ' ')}
          </span>
        )}
        {expanded ? (
          <ChevronDown size={12} className="text-cult-text flex-shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-cult-text flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-4 pl-11 space-y-3">
          <p className="text-xs text-cult-text leading-relaxed">
            {rec.recommendation}
          </p>
          {rec.reasoning && (
            <div className="flex items-start gap-2">
              <span className="font-mono text-[9px] text-purple-400/60 tracking-wider uppercase mt-0.5 flex-shrink-0">
                Why:
              </span>
              <p className="text-[11px] text-cult-text/70 leading-relaxed italic">
                {rec.reasoning}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onActedOn() }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase
                bg-cult-green-bright/10 text-cult-green-bright border border-cult-green-bright/30
                rounded-sm hover:bg-cult-green-bright/20 transition-colors"
            >
              <CheckCheck size={10} />
              Acted On
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss() }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase
                text-cult-text border border-cult-border rounded-sm
                hover:text-cult-white hover:border-cult-border/80 transition-colors"
            >
              <X size={10} />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
