// AI Ops observability hook — reads from Context DB (uayyhluztelnfxfvdhyt)
import { useState, useEffect, useCallback } from 'react'
import { contextDb } from '../lib/contextDb'

// ── Types ──

export interface InteractionLogEntry {
  id: string
  queried_at: string
  user_email: string | null
  raw_message: string | null
  intent_classified: string | null
  category_matched: string | null
  tables_queried: string[] | null
  result_type: string | null
  response_latency_ms: number | null
  feedback_score: number | null
  feedback_note: string | null
  escalated_to_justin: boolean | null
}

export interface HealthSnapshot {
  id: string
  snapshot_at: string
  table_name: string
  row_count: number
  embedded_rows: number
  missing_embeddings: number
  superseded_rows: number
}

export interface IssueLogEntry {
  id: string
  reported_at: string
  reported_by: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string | null
  description: string
  auto_triage_suggestion: string | null
  status: 'open' | 'in_progress' | 'resolved'
  resolved_at: string | null
  resolution_note: string | null
  lessons_learned_id: string | null
}

export interface ContextGapEntry {
  id: string
  category: string
  key: string
  value: string
  created_at: string
}

export interface DBHealthSummary {
  totalRows: number
  totalEmbedded: number
  totalMissing: number
  totalSuperseded: number
  coveragePct: number
  tables: HealthSnapshot[]
}

export interface InteractionStats {
  total: number
  confident: number
  fallback: number
  noAnswer: number
  avgLatencyMs: number
  feedbackPositive: number
  feedbackNegative: number
}

// ── Hook ──

interface UseAIOpsReturn {
  // Data
  interactions: InteractionLogEntry[]
  healthSummary: DBHealthSummary | null
  issues: IssueLogEntry[]
  contextGaps: ContextGapEntry[]
  interactionStats: InteractionStats | null

  // State
  loading: boolean
  error: string | null

  // Actions
  refresh: () => void
  resolveIssue: (id: string, note: string) => Promise<void>
  addContextEntry: (category: string, key: string, value: string) => Promise<void>
}

export function useAIOps(): UseAIOpsReturn {
  const [interactions, setInteractions] = useState<InteractionLogEntry[]>([])
  const [healthSnapshots, setHealthSnapshots] = useState<HealthSnapshot[]>([])
  const [issues, setIssues] = useState<IssueLogEntry[]>([])
  const [contextGaps, setContextGaps] = useState<ContextGapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Parallel fetch all data sources
      const [interactionsRes, healthRes, issuesRes, gapsRes] = await Promise.all([
        // Last 200 interaction logs
        contextDb
          .from('user_interaction_log')
          .select('*')
          .order('queried_at', { ascending: false })
          .limit(200),

        // Latest health snapshot per table (most recent run)
        contextDb
          .from('db_health_snapshot')
          .select('*')
          .order('snapshot_at', { ascending: false })
          .limit(50),

        // All non-resolved issues + recently resolved
        contextDb
          .from('issue_log')
          .select('*')
          .order('reported_at', { ascending: false })
          .limit(100),

        // Context entries flagged as gaps (category = 'context_gap')
        contextDb
          .from('business_context')
          .select('id, category, key, value, created_at')
          .eq('category', 'context_gap')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      if (interactionsRes.error) throw interactionsRes.error
      if (healthRes.error) throw healthRes.error
      if (issuesRes.error) throw issuesRes.error
      // gaps might not have entries yet — soft fail

      setInteractions((interactionsRes.data as InteractionLogEntry[]) || [])
      setIssues((issuesRes.data as IssueLogEntry[]) || [])
      setContextGaps((gapsRes.data as ContextGapEntry[]) || [])

      // Dedupe health snapshots to latest per table
      const snapMap = new Map<string, HealthSnapshot>()
      for (const row of (healthRes.data || []) as HealthSnapshot[]) {
        if (!snapMap.has(row.table_name)) {
          snapMap.set(row.table_name, row)
        }
      }
      setHealthSnapshots(Array.from(snapMap.values()))
    } catch (err: any) {
      console.error('[AI Ops] Fetch error:', err)
      setError(err.message || 'Failed to load AI Ops data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Resolve an issue
  const resolveIssue = useCallback(async (id: string, note: string) => {
    const { error: updateErr } = await contextDb
      .from('issue_log')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      })
      .eq('id', id)
    if (updateErr) throw updateErr
    // Refresh
    fetchAll()
  }, [fetchAll])

  // Add a context entry (fill a gap from UI)
  const addContextEntry = useCallback(async (category: string, key: string, value: string) => {
    const { error: insertErr } = await contextDb
      .from('business_context')
      .insert({
        category,
        key,
        value,
        source: 'ai-ops-ui',
        confidence: 1.0,
        is_current: true,
      })
    if (insertErr) throw insertErr
    fetchAll()
  }, [fetchAll])

  // Compute interaction stats
  const interactionStats: InteractionStats | null = interactions.length > 0
    ? {
        total: interactions.length,
        confident: interactions.filter(i => i.result_type === 'confident').length,
        fallback: interactions.filter(i => i.result_type === 'fallback').length,
        noAnswer: interactions.filter(i => i.result_type === 'no_answer' || i.result_type === 'error').length,
        avgLatencyMs: Math.round(
          interactions
            .filter(i => i.response_latency_ms != null)
            .reduce((sum, i) => sum + (i.response_latency_ms || 0), 0) /
          (interactions.filter(i => i.response_latency_ms != null).length || 1)
        ),
        feedbackPositive: interactions.filter(i => i.feedback_score === 1).length,
        feedbackNegative: interactions.filter(i => i.feedback_score === -1).length,
      }
    : null

  // Compute health summary
  const healthSummary: DBHealthSummary | null = healthSnapshots.length > 0
    ? {
        totalRows: healthSnapshots.reduce((s, h) => s + h.row_count, 0),
        totalEmbedded: healthSnapshots.reduce((s, h) => s + h.embedded_rows, 0),
        totalMissing: healthSnapshots.reduce((s, h) => s + h.missing_embeddings, 0),
        totalSuperseded: healthSnapshots.reduce((s, h) => s + h.superseded_rows, 0),
        coveragePct: (() => {
          const total = healthSnapshots.reduce((s, h) => s + h.row_count, 0)
          const embedded = healthSnapshots.reduce((s, h) => s + h.embedded_rows, 0)
          return total > 0 ? Math.round((embedded / total) * 100) : 0
        })(),
        tables: healthSnapshots,
      }
    : null

  return {
    interactions,
    healthSummary,
    issues,
    contextGaps,
    interactionStats,
    loading,
    error,
    refresh: fetchAll,
    resolveIssue,
    addContextEntry,
  }
}
