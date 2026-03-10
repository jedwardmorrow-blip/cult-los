import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useVTO } from '../hooks/useVTO'
import { supabase } from '../lib/supabase'
import type { CoreValue, OneYearGoal, Rock } from '../types'
import {
  Compass,
  Target,
  Rocket,
  BarChart3,
  Calendar,
  Sparkles,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'

// ─── Helpers ───
function SectionCard({
  icon: Icon,
  title,
  accent = false,
  children,
}: {
  icon: React.ElementType
  title: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg border ${accent ? 'border-cult-gold/30 bg-cult-gold/5' : 'border-cult-border bg-cult-surface'} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={accent ? 'text-cult-gold' : 'text-cult-text'} />
        <h3 className={`font-display text-sm tracking-widest uppercase ${accent ? 'text-cult-gold' : 'text-cult-white'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function EditableTextarea({
  value,
  onChange,
  editing,
  placeholder,
  rows = 2,
}: {
  value: string | null
  onChange: (v: string) => void
  editing: boolean
  placeholder: string
  rows?: number
}) {
  if (!editing) {
    return (
      <p className="text-sm text-cult-text leading-relaxed whitespace-pre-wrap">
        {value || <span className="italic text-cult-text/40">{placeholder}</span>}
      </p>
    )
  }
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-cult-dark border border-cult-border rounded-md px-3 py-2 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50 resize-none"
    />
  )
}

function EditableInput({
  value,
  onChange,
  editing,
  placeholder,
  type = 'text',
  prefix,
}: {
  value: string | null
  onChange: (v: string) => void
  editing: boolean
  placeholder: string
  type?: string
  prefix?: string
}) {
  if (!editing) {
    return (
      <span className="text-sm text-cult-white">
        {prefix && value ? prefix : ''}
        {value || <span className="italic text-cult-text/40">{placeholder}</span>}
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-sm text-cult-text">{prefix}</span>}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50"
      />
    </div>
  )
}

// ─── Main Page ───
export default function VTOPage() {
  const { profile } = useAuth()
  const { isAdmin, isOwner } = usePermissions()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [rocks, setRocks] = useState<Rock[]>([])

  // Load business ID
  useEffect(() => {
    async function loadBusiness() {
      const { data } = await supabase.from('businesses').select('id').limit(1).single()
      if (data) setBusinessId(data.id)
    }
    loadBusiness()
  }, [])

  // Load current quarter rocks for 1-Year Plan connection
  useEffect(() => {
    async function loadRocks() {
      if (!businessId) return
      const now = new Date()
      const q = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
      const { data } = await supabase
        .from('rocks')
        .select('*, profiles(id, full_name, avatar_url)')
        .eq('business_id', businessId)
        .eq('quarter', q)
        .order('created_at')
      if (data) setRocks(data as Rock[])
    }
    loadRocks()
  }, [businessId])

  const { vto, loading, saving, error, updateField, save, hasChanges } = useVTO(businessId || undefined)

  const canEdit = isAdmin || isOwner

  async function handleSave() {
    await save()
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
    // Reload to discard changes
    window.location.reload()
  }

  // ─── Core Values helpers ───
  function addCoreValue() {
    if (!vto) return
    updateField('core_values', [...vto.core_values, { value: '', description: '' }])
  }
  function updateCoreValue(idx: number, field: keyof CoreValue, val: string) {
    if (!vto) return
    const updated = [...vto.core_values]
    updated[idx] = { ...updated[idx], [field]: val }
    updateField('core_values', updated)
  }
  function removeCoreValue(idx: number) {
    if (!vto) return
    updateField('core_values', vto.core_values.filter((_, i) => i !== idx))
  }

  // ─── 3-Year Measurables helpers ───
  function addMeasurable() {
    if (!vto) return
    updateField('three_year_measurables', [...vto.three_year_measurables, ''])
  }
  function updateMeasurable(idx: number, val: string) {
    if (!vto) return
    const updated = [...vto.three_year_measurables]
    updated[idx] = val
    updateField('three_year_measurables', updated)
  }
  function removeMeasurable(idx: number) {
    if (!vto) return
    updateField('three_year_measurables', vto.three_year_measurables.filter((_, i) => i !== idx))
  }

  // ─── 1-Year Goals helpers ───
  function addGoal() {
    if (!vto) return
    updateField('one_year_goals', [...vto.one_year_goals, { goal: '', status: 'on_track' }])
  }
  function updateGoal(idx: number, field: keyof OneYearGoal, val: string) {
    if (!vto) return
    const updated = [...vto.one_year_goals]
    updated[idx] = { ...updated[idx], [field]: val }
    updateField('one_year_goals', updated as OneYearGoal[])
  }
  function removeGoal(idx: number) {
    if (!vto) return
    updateField('one_year_goals', vto.one_year_goals.filter((_, i) => i !== idx))
  }

  // ─── Loading / Error ───
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cult-gold" size={24} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-cult-red-bright text-sm font-mono">
        Error: {error}
      </div>
    )
  }

  if (!vto) return null

  // ─── Ten-Year Progress ───
  const tenYearProgress = vto.ten_year_target_date
    ? (() => {
        const target = new Date(vto.ten_year_target_date).getTime()
        const now = Date.now()
        const start = target - 10 * 365.25 * 24 * 60 * 60 * 1000
        const elapsed = now - start
        const total = target - start
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
      })()
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-cult-white tracking-wider">V/TO</h1>
          <p className="font-mono text-xs text-cult-text tracking-widest mt-1">
            VISION / TRACTION ORGANIZER
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cult-surface border border-cult-border">
              <Eye size={12} className="text-cult-text" />
              <span className="font-mono text-[10px] text-cult-text">READ ONLY</span>
            </div>
          )}
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cult-gold/10 border border-cult-gold/30 text-cult-gold hover:bg-cult-gold/20 transition-colors"
            >
              <Pencil size={12} />
              <span className="font-mono text-xs">Edit</span>
            </button>
          )}
          {canEdit && editing && (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cult-surface border border-cult-border text-cult-text hover:text-cult-white transition-colors"
              >
                <X size={12} />
                <span className="font-mono text-xs">Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cult-gold text-cult-black font-mono text-xs hover:bg-cult-gold/90 transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span>Save</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* I3: Core Values */}
      <SectionCard icon={Sparkles} title="Core Values" accent>
        {vto.core_values.length === 0 && !editing && (
          <p className="text-sm italic text-cult-text/40">No core values defined yet.</p>
        )}
        <div className="space-y-3">
          {vto.core_values.map((cv, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-display text-cult-gold text-xs">{idx + 1}</span>
              </div>
              {editing ? (
                <div className="flex-1 space-y-1">
                  <input
                    value={cv.value}
                    onChange={e => updateCoreValue(idx, 'value', e.target.value)}
                    placeholder="Core value..."
                    className="w-full bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50 font-medium"
                  />
                  <input
                    value={cv.description || ''}
                    onChange={e => updateCoreValue(idx, 'description', e.target.value)}
                    placeholder="Behavioral example or description..."
                    className="w-full bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-xs text-cult-text placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50"
                  />
                  <button onClick={() => removeCoreValue(idx)} className="text-cult-red-bright/60 hover:text-cult-red-bright text-xs flex items-center gap-1 mt-1">
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-cult-white font-medium">{cv.value}</p>
                  {cv.description && (
                    <p className="text-xs text-cult-text mt-0.5">{cv.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <button onClick={addCoreValue} className="mt-3 flex items-center gap-1.5 text-cult-gold text-xs hover:text-cult-gold/80 transition-colors">
            <Plus size={12} /> Add Core Value
          </button>
        )}
      </SectionCard>

      {/* I4: Core Focus */}
      <SectionCard icon={Compass} title="Core Focus">
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Purpose / Cause / Passion
            </label>
            <EditableTextarea
              value={vto.purpose}
              onChange={v => updateField('purpose', v)}
              editing={editing}
              placeholder="What is your company's purpose?"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Niche
            </label>
            <EditableTextarea
              value={vto.niche}
              onChange={v => updateField('niche', v)}
              editing={editing}
              placeholder="What is your company's niche?"
            />
          </div>
        </div>
      </SectionCard>

      {/* I5: 10-Year Target */}
      <SectionCard icon={Target} title="10-Year Target">
        <div className="space-y-3">
          <EditableTextarea
            value={vto.ten_year_target}
            onChange={v => updateField('ten_year_target', v)}
            editing={editing}
            placeholder="What is your audacious 10-year target?"
            rows={3}
          />
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Target Date
            </label>
            {editing ? (
              <input
                type="date"
                value={vto.ten_year_target_date || ''}
                onChange={e => updateField('ten_year_target_date', e.target.value)}
                className="bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-sm text-cult-white focus:outline-none focus:border-cult-gold/50"
              />
            ) : (
              <span className="text-sm text-cult-white">
                {vto.ten_year_target_date
                  ? new Date(vto.ten_year_target_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : <span className="italic text-cult-text/40">Not set</span>}
              </span>
            )}
          </div>
          {/* Progress indicator */}
          {tenYearProgress !== null && !editing && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-cult-text">Progress to target</span>
                <span className="font-mono text-[10px] text-cult-gold">{tenYearProgress}%</span>
              </div>
              <div className="h-1.5 bg-cult-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cult-gold/60 to-cult-gold rounded-full transition-all"
                  style={{ width: `${tenYearProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* I6: 3-Year Picture */}
      <SectionCard icon={Rocket} title="3-Year Picture">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Revenue
            </label>
            <EditableInput
              value={vto.three_year_revenue}
              onChange={v => updateField('three_year_revenue', v)}
              editing={editing}
              placeholder="e.g. $10M"
              prefix="$"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Profit
            </label>
            <EditableInput
              value={vto.three_year_profit}
              onChange={v => updateField('three_year_profit', v)}
              editing={editing}
              placeholder="e.g. $2M"
              prefix="$"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
            What does it look like?
          </label>
          <EditableTextarea
            value={vto.three_year_picture}
            onChange={v => updateField('three_year_picture', v)}
            editing={editing}
            placeholder="Paint the picture of what the business looks like in 3 years..."
            rows={4}
          />
        </div>

        <div>
          <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
            Key Measurables
          </label>
          {vto.three_year_measurables.length === 0 && !editing && (
            <p className="text-sm italic text-cult-text/40">No measurables defined.</p>
          )}
          <div className="space-y-2">
            {vto.three_year_measurables.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cult-gold/60 flex-shrink-0" />
                {editing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={m}
                      onChange={e => updateMeasurable(idx, e.target.value)}
                      placeholder="Measurable..."
                      className="flex-1 bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50"
                    />
                    <button onClick={() => removeMeasurable(idx)} className="text-cult-red-bright/60 hover:text-cult-red-bright">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-cult-text">{m}</span>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <button onClick={addMeasurable} className="mt-2 flex items-center gap-1.5 text-cult-gold text-xs hover:text-cult-gold/80 transition-colors">
              <Plus size={12} /> Add Measurable
            </button>
          )}
        </div>
      </SectionCard>

      {/* I7: 1-Year Plan */}
      <SectionCard icon={BarChart3} title="1-Year Plan">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Revenue Goal
            </label>
            <EditableInput
              value={vto.one_year_revenue}
              onChange={v => updateField('one_year_revenue', v)}
              editing={editing}
              placeholder="e.g. $5M"
              prefix="$"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-1.5 block">
              Profit Goal
            </label>
            <EditableInput
              value={vto.one_year_profit}
              onChange={v => updateField('one_year_profit', v)}
              editing={editing}
              placeholder="e.g. $1M"
              prefix="$"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-2 block">
            Goals
          </label>
          {vto.one_year_goals.length === 0 && !editing && (
            <p className="text-sm italic text-cult-text/40">No 1-year goals defined.</p>
          )}
          <div className="space-y-2">
            {vto.one_year_goals.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {g.status === 'complete' ? (
                  <CheckCircle2 size={14} className="text-cult-green-bright flex-shrink-0" />
                ) : g.status === 'off_track' ? (
                  <AlertCircle size={14} className="text-cult-red-bright flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-cult-gold/40 flex-shrink-0" />
                )}
                {editing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={g.goal}
                      onChange={e => updateGoal(idx, 'goal', e.target.value)}
                      placeholder="1-year goal..."
                      className="flex-1 bg-cult-dark border border-cult-border rounded-md px-3 py-1.5 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/50"
                    />
                    <select
                      value={g.status || 'on_track'}
                      onChange={e => updateGoal(idx, 'status', e.target.value)}
                      className="bg-cult-dark border border-cult-border rounded-md px-2 py-1.5 text-xs text-cult-text focus:outline-none focus:border-cult-gold/50"
                    >
                      <option value="on_track">On Track</option>
                      <option value="off_track">Off Track</option>
                      <option value="complete">Complete</option>
                    </select>
                    <button onClick={() => removeGoal(idx)} className="text-cult-red-bright/60 hover:text-cult-red-bright">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm ${g.status === 'complete' ? 'text-cult-text line-through' : 'text-cult-white'}`}>
                    {g.goal}
                  </span>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <button onClick={addGoal} className="mt-2 flex items-center gap-1.5 text-cult-gold text-xs hover:text-cult-gold/80 transition-colors">
              <Plus size={12} /> Add Goal
            </button>
          )}
        </div>

        {/* Connected Quarterly Rocks */}
        {rocks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cult-border">
            <label className="font-mono text-[10px] text-cult-text tracking-widest uppercase mb-2 block">
              Current Quarterly Rocks
            </label>
            <div className="space-y-1.5">
              {rocks.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.status === 'complete'
                        ? 'bg-cult-green-bright'
                        : r.status === 'off_track'
                        ? 'bg-cult-red-bright'
                        : 'bg-cult-gold'
                    }`}
                  />
                  <span className="text-cult-text">{r.title}</span>
                  {r.profiles && (
                    <span className="text-[10px] text-cult-text/50 font-mono ml-auto">
                      {r.profiles.full_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Quarterly Theme */}
      <SectionCard icon={Calendar} title="Quarterly Theme">
        <EditableTextarea
          value={vto.quarterly_theme}
          onChange={v => updateField('quarterly_theme', v)}
          editing={editing}
          placeholder="What is the team's rallying theme this quarter?"
          rows={2}
        />
      </SectionCard>

      {/* Last updated */}
      {vto.updated_at && (
        <div className="text-center">
          <span className="font-mono text-[10px] text-cult-text/40">
            Last updated {new Date(vto.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  )
}
