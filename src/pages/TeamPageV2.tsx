import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, Goal } from '../types'
import { Target, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react'

interface MemberData { profile: Profile; goals: Goal[]; northStar: string }

const STATUS_ICONS = {
  not_started: { icon: Circle, cls: 'text-cult-text' },
  in_progress: { icon: Clock, cls: 'text-amber-400' },
  completed: { icon: CheckCircle2, cls: 'text-green-400' },
  at_risk: { icon: AlertTriangle, cls: 'text-red-400' },
}

const ROLE_LABELS: Record<string, string> = {
  CEO: 'CEO & Founder', COO_CFO: 'COO / CFO', Chief_of_Staff: 'Chief of Staff',
  Director_of_Sales: 'Director of Sales', Cultivation_Lead: 'Cultivation Lead',
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberData[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTeam() }, [])

  async function fetchTeam() {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('is_active', true).order('full_name')
    if (!profiles) { setLoading(false); return }
    const memberData = await Promise.all(profiles.map(async (profile: Profile) => {
      const { data: plan } = await supabase.from('plans').select('north_star').eq('profile_id', profile.id).eq('status', 'active').single()
      const { data: goals } = await supabase.from('goals').select('*').eq('profile_id', profile.id).order('phase')
      return { profile, goals: goals || [], northStar: plan?.north_star || '' }
    }))
    setMembers(memberData)
    if (memberData.length > 0) setSelected(memberData[0].profile.id)
    setLoading(false)
  }

  const sel = members.find(m => m.profile.id === selected)
  const ini = (name: string) => name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  const pct = (goals: Goal[]) => !goals.length ? 0 : Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="font-mono text-xs text-cult-text animate-pulse">LOADING...</div></div>

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/70 uppercase mb-1">Q1 2026</div>
        <h1 className="section-title">Leadership Team</h1>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          {members.map(({ profile, goals }) => {
            const p = pct(goals), isActive = selected === profile.id
            return (
              <button key={profile.id} onClick={() => setSelected(profile.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${isActive ? 'bg-cult-gold/10 border-cult-gold/30' : 'bg-cult-card border-cult-border hover:border-cult-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-mono font-medium ${isActive ? 'bg-cult-gold/20 border border-cult-gold/40 text-cult-gold' : 'bg-cult-muted border border-cult-border text-cult-text'}`}>
                    {ini(profile.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cult-white truncate">{profile.full_name}</div>
                    <div className="font-mono text-[10px] text-cult-text truncate">{ROLE_LABELS[profile.role] || profile.role}</div>
                  </div>
                </div>
                {goals.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1 bg-cult-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cult-gold/60 rounded-full" style={{ width: `${p}%` }} />
                    </div>
                    <div className="font-mono text-[9px] text-cult-text mt-1">{p}% complete</div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="col-span-2">
          {sel ? (
            <div className="card p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-sm text-cult-gold">{ini(sel.profile.full_name)}</span>
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-wider text-cult-white">{sel.profile.full_name.toUpperCase()}</h2>
                  <div className="font-mono text-xs text-cult-text">{ROLE_LABELS[sel.profile.role] || sel.profile.role}</div>
                </div>
              </div>
              {sel.northStar && (
                <div className="bg-cult-gold/5 border border-cult-gold/20 rounded-lg p-4">
                  <div className="font-mono text-[10px] text-cult-gold/60 uppercase mb-2 flex items-center gap-1.5"><Target size={10} /> North Star</div>
                  <p className="text-cult-white text-xs leading-relaxed">{sel.northStar}</p>
                </div>
              )}
              {[1, 2, 3].map(phase => {
                const pg = sel.goals.filter(g => g.phase === phase)
                if (!pg.length) return null
                const lbs: Record<number, string> = { 1: 'Days 1-30', 2: 'Days 31-60', 3: 'Days 61-90' }
                const cls: Record<number, string> = { 1: 'text-cult-gold', 2: 'text-blue-300', 3: 'text-purple-300' }
                return (
                  <div key={phase}>
                    <div className={`font-mono text-[10px] tracking-widest uppercase mb-2 ${cls[phase]}`}>{lbs[phase]}</div>
                    <div className="space-y-2">
                      {pg.map(goal => {
                        const s = STATUS_ICONS[goal.status]; const I = s.icon
                        return (
                          <div key={goal.id} className="flex items-start gap-2.5">
                            <I size={13} className={`${s.cls} mt-0.5 flex-shrink-0`} />
                            <p className={`text-xs leading-snug ${goal.status === 'completed' ? 'line-through text-cult-text' : 'text-cult-white'}`}>{goal.title}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {sel.goals.length === 0 && <div className="text-center py-8"><Target size={24} className="text-cult-text mx-auto mb-2" /><p className="text-cult-text text-xs font-mono">No plan goals yet</p></div>}
            </div>
          ) : <div className="card p-6 flex items-center justify-center h-64"><p className="text-cult-text text-xs font-mono">Select a team member</p></div>}
        </div>
      </div>
    </div>
  )
}