import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Goal, Plan } from '../types'
import { CheckCircle2, Circle, Clock, AlertTriangle, Target, ChevronDown, ChevronUp } from 'lucide-react'

const PHASES = [
  { num: 1 as const, label: 'Days 1–30', subtitle: 'Foundation', color: 'cult-gold' },
  { num: 2 as const, label: 'Days 31–60', subtitle: 'Growth', color: 'blue-300' },
  { num: 3 as const, label: 'Days 61–90', subtitle: 'Ownership', color: 'purple-300' },
]

const STATUS_CONFIG = {
  not_started: { icon: Circle, cls: 'text-cult-text', label: 'Not Started' },
  in_progress: { icon: Clock, cls: 'text-cult-amber-bright', label: 'In Progress' },
  completed: { icon: CheckCircle2, cls: 'text-cult-green-bright', label: 'Complete' },
  at_risk: { icon: AlertTriangle, cls: 'text-cult-red-bright', label: 'At Risk' },
}

const STATUS_OPTIONS = ['not_started', 'in_progress', 'completed', 'at_risk'] as const

export default function PlanPage() {
  const { profile } = useAuth()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchPlan() }, [profile])

  async function fetchPlan() {
    if (!profile) return
    const { data: planData } = await supabase.from('plans').select('*').eq('profile_id', profile.id).eq('status', 'active').single()
    const { data: goalsData } = await supabase.from('goals').select('*').eq('profile_id', profile.id).order('phase').order('created_at')
    setPlan(planData)
    setGoals(goalsData || [])
    setLoading(false)
  }

  async function updateGoalStatus(goalId: string, status: Goal['status']) {
    setUpdatingId(goalId)
    const updates: Partial<Goal> = { status }
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    await supabase.from('goals').update(updates).eq('id', goalId)
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g))
    setUpdatingId(null)
  }

  const completedGoals = goals.filter(g => g.status === 'completed').length
  const progressPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

  if (loading) return <div className="flex items-center justify-center h-64"><div className="font-mono text-xs text-cult-text tracking-widest animate-pulse">LOADING...</div></div>
  if (!plan) return <div className="flex items-center justify-center h-64"><div className="text-center"><Target size={32} className="text-cult-text mx-auto mb-3" /><p className="text-cult-text text-sm">No active plan found.</p></div></div>

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">Q1 2026 · 90-Day Plan</div>
        <h1 className="section-title mb-4">My Improvement Plan</h1>
        <div className="card p-4 border-cult-gold/20 bg-cult-gold/5 mb-6">
          <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/60 uppercase mb-2">North Star</div>
          <p className="text-cult-white text-sm leading-relaxed">{plan.north_star}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-cult-text tracking-wider">Overall Progress</span>
            <span className="font-mono text-xs text-cult-gold">{completedGoals} / {goals.length} goals</span>
          </div>
          <div className="h-2 bg-cult-muted rounded-full overflow-hidden">
            <div className="h-full bg-cult-gold rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-right font-display text-2xl text-cult-gold">{progressPct}%</div>
        </div>
      </div>

      <div className="space-y-4">
        {PHASES.map(phase => {
          const phaseGoals = goals.filter(g => g.phase === phase.num)
          const phaseDone = phaseGoals.filter(g => g.status === 'completed').length
          const isExpanded = expandedPhase === phase.num
          return (
            <div key={phase.num} className="card overflow-hidden">
              <button onClick={() => setExpandedPhase(isExpanded ? null : phase.num)} className="w-full flex items-center justify-between p-4 hover:bg-cult-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-8 rounded-full bg-${phase.color}`} />
                  <div className="text-left">
                    <div className={`font-display text-lg tracking-wider text-${phase.color}`}>{phase.label}</div>
                    <div className="font-mono text-[10px] text-cult-text tracking-wider uppercase">{phase.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-cult-text">{phaseDone}/{phaseGoals.length}</span>
                  {isExpanded ? <ChevronUp size={14} className="text-cult-text" /> : <ChevronDown size={14} className="text-cult-text" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-cult-border/50">
                  {phaseGoals.length === 0 && <p className="text-cult-text text-xs font-mono text-center py-6">No goals in this phase yet.</p>}
                  {phaseGoals.map(goal => {
                    const s = STATUS_CONFIG[goal.status]
                    const StatusIcon = s.icon
                    return (
                      <div key={goal.id} className="flex items-start gap-3 py-3 border-b border-cult-border/30 last:border-0 group">
                        <button onClick={() => updateGoalStatus(goal.id, goal.status === 'completed' ? 'not_started' : 'completed')} disabled={updatingId === goal.id} className={`mt-0.5 flex-shrink-0 ${s.cls} hover:scale-110 transition-transform`}>
                          <StatusIcon size={16} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${goal.status === 'completed' ? 'line-through text-cult-text' : 'text-cult-white'}`}>{goal.title}</p>
                          {goal.description && <p className="text-xs text-cult-text mt-1 leading-relaxed">{goal.description}</p>}
                          {goal.success_metric && <div className="mt-2 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-cult-gold/50" /><span className="font-mono text-[10px] text-cult-gold/70">Metric: {goal.success_metric}</span></div>}
                        </div>
                        <select value={goal.status} onChange={e => updateGoalStatus(goal.id, e.target.value as Goal['status'])} className="opacity-0 group-hover:opacity-100 transition-opacity bg-cult-dark border border-cult-border rounded text-xs text-cult-text px-2 py-1 font-mono focus:outline-none focus:border-cult-gold" disabled={updatingId === goal.id}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}