import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { VTO, CoreValue, OneYearGoal } from '../types'

interface UseVTOReturn {
  vto: VTO | null
  loading: boolean
  saving: boolean
  error: string | null
  updateField: <K extends keyof VTO>(field: K, value: VTO[K]) => void
  save: () => Promise<void>
  hasChanges: boolean
}

export function useVTO(businessId?: string): UseVTOReturn {
  const { profile } = useAuth()
  const [vto, setVto] = useState<VTO | null>(null)
  const [original, setOriginal] = useState<VTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('vto')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data) {
      const parsed: VTO = {
        ...data,
        core_values: (data.core_values as CoreValue[]) || [],
        three_year_measurables: (data.three_year_measurables as string[]) || [],
        one_year_goals: (data.one_year_goals as OneYearGoal[]) || [],
      }
      setVto(parsed)
      setOriginal(parsed)
    } else {
      // Create default VTO for this business
      const { data: created, error: createErr } = await supabase
        .from('vto')
        .insert({
          business_id: businessId,
          core_values: [],
          three_year_measurables: [],
          one_year_goals: [],
          updated_by: profile?.id,
        })
        .select()
        .single()

      if (createErr) {
        setError(createErr.message)
      } else if (created) {
        const parsed: VTO = {
          ...created,
          core_values: [],
          three_year_measurables: [],
          one_year_goals: [],
        }
        setVto(parsed)
        setOriginal(parsed)
      }
    }

    setLoading(false)
  }, [businessId, profile?.id])

  useEffect(() => {
    load()
  }, [load])

  const updateField = useCallback(<K extends keyof VTO>(field: K, value: VTO[K]) => {
    setVto(prev => prev ? { ...prev, [field]: value } : prev)
  }, [])

  const hasChanges = vto !== null && original !== null && JSON.stringify(vto) !== JSON.stringify(original)

  const save = useCallback(async () => {
    if (!vto) return
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('vto')
      .update({
        core_values: vto.core_values,
        purpose: vto.purpose,
        niche: vto.niche,
        ten_year_target: vto.ten_year_target,
        ten_year_target_date: vto.ten_year_target_date,
        three_year_revenue: vto.three_year_revenue,
        three_year_profit: vto.three_year_profit,
        three_year_measurables: vto.three_year_measurables,
        three_year_picture: vto.three_year_picture,
        one_year_revenue: vto.one_year_revenue,
        one_year_profit: vto.one_year_profit,
        one_year_goals: vto.one_year_goals,
        quarterly_theme: vto.quarterly_theme,
        updated_by: profile?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vto.id)

    if (err) {
      setError(err.message)
    } else {
      setOriginal(vto)
      // I10: Sync VTO to Context DB (fire-and-forget)
      supabase.functions.invoke('vto-context-sync').catch(e => console.warn('VTO context sync:', e))
    }

    setSaving(false)
  }, [vto, profile?.id])

  return { vto, loading, saving, error, updateField, save, hasChanges }
}
