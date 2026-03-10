import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { contextDb } from '../lib/contextDb'
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

  // E7: Log recommendation feedback to Context DB (non-blocking)
  const logFeedback = useCallback(async (rec: ClaudeRecommendation, action: 'dismissed' | 'acted_on') => {
    try {
      await contextDb.from('business_context').insert({
        category: 'recommendation_feedback',
        key: `feedback_${action}_${rec.id.slice(0, 8)}`,
        value: JSON.stringify({
          recommendation_id: rec.id,
          title: rec.title,
          category: rec.category,
          priority_level: rec.priority_level,
          action,
          source_session: rec.source_session,
        }),
        metadata: {
          action,
          recommendation_category: rec.category,
          priority_level: rec.priority_level,
        },
        confidence: 1.0,
        source: 'cult-los-app',
        is_current: true,
      })
    } catch (err) {
      console.warn('[E7] Failed to log recommendation feedback:', err)
    }
  }, [])

  const dismissRecommendation = useCallback(async (id: string) => {
    const rec = recommendations.find(r => r.id === id)
    const { error } = await supabase
      .from('claude_recommendations')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error dismissing recommendation:', error)
      return
    }
    setRecommendations(prev => prev.filter(r => r.id !== id))
    // E7: Log feedback to Context DB
    if (rec) logFeedback(rec, 'dismissed')
  }, [recommendations, logFeedback])

  const markActedOn = useCallback(async (id: string) => {
    const rec = recommendations.find(r => r.id === id)
    const { error } = await supabase
      .from('claude_recommendations')
      .update({ status: 'acted_on', acted_on_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error marking recommendation:', error)
      return
    }
    setRecommendations(prev => prev.filter(r => r.id !== id))
    // E7: Log feedback to Context DB
    if (rec) logFeedback(rec, 'acted_on')
  }, [recommendations, logFeedback])

  return {
    recommendations,
    loading,
    dismissRecommendation,
    markActedOn,
    refetch: fetchRecommendations,
  }
}
