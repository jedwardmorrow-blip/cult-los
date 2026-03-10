import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ClaudeRecommendation } from '../types'

export function useClaudeRecommendations() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<ClaudeRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecommendations = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const { data, error } = await supabase
      .from('claude_recommendations')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('priority_level')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recommendations:', error)
    }
    if (data) {
      // Sort by priority: critical > high > medium > low
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      const sorted = data.sort((a, b) =>
        (priorityOrder[a.priority_level] ?? 9) - (priorityOrder[b.priority_level] ?? 9)
      )
      setRecommendations(sorted as ClaudeRecommendation[])
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const dismissRecommendation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('claude_recommendations')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error dismissing recommendation:', error)
      return
    }
    setRecommendations(prev => prev.filter(r => r.id !== id))
  }, [])

  const markActedOn = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('claude_recommendations')
      .update({ status: 'acted_on', acted_on_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error marking recommendation:', error)
      return
    }
    setRecommendations(prev => prev.filter(r => r.id !== id))
  }, [])

  return {
    recommendations,
    loading,
    dismissRecommendation,
    markActedOn,
    refetch: fetchRecommendations,
  }
}
