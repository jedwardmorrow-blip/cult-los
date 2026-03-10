// E4: Log meeting session summaries to the Context DB
// Uses the supersede pattern consistent with context-db-bridge Edge Function
import { contextDb } from './contextDb'

interface MeetingSessionLog {
  roomId: string
  roomName?: string
  meetingDate: string
  rating: number | null
  cascadingMessages: string
  todoStats: { total: number; completed: number }
  rockStats: { onTrack: number; offTrack: number; done: number }
  issueStats: { total: number; resolved: number }
  attendeeCount: number
  recordedBy: string
}

/**
 * Logs a meeting session summary to the Context DB business_context table.
 * Creates a timestamped entry under category "meeting_sessions" and supersedes
 * any previous "latest_meeting_session" entry so queries can always find the most recent.
 */
export async function logMeetingSession(session: MeetingSessionLog): Promise<void> {
  try {
    const now = new Date().toISOString()
    const todoCompletionRate = session.todoStats.total > 0
      ? Math.round((session.todoStats.completed / session.todoStats.total) * 100)
      : 0
    const issueResolutionRate = session.issueStats.total > 0
      ? Math.round((session.issueStats.resolved / session.issueStats.total) * 100)
      : 0
    const rockHealthScore = (session.rockStats.onTrack + session.rockStats.done) > 0
      ? Math.round(((session.rockStats.onTrack + session.rockStats.done) /
          (session.rockStats.onTrack + session.rockStats.offTrack + session.rockStats.done)) * 100)
      : 0

    const sessionValue = JSON.stringify({
      room_id: session.roomId,
      room_name: session.roomName || 'Unknown',
      meeting_date: session.meetingDate,
      rating: session.rating,
      cascading_messages: session.cascadingMessages,
      todo_stats: session.todoStats,
      rock_stats: session.rockStats,
      issue_stats: session.issueStats,
      attendee_count: session.attendeeCount,
      computed: {
        todo_completion_rate: todoCompletionRate,
        issue_resolution_rate: issueResolutionRate,
        rock_health_score: rockHealthScore,
      },
    })

    // 1. Supersede previous "latest_meeting_session" entry
    const { data: prev } = await contextDb
      .from('business_context')
      .select('id')
      .eq('category', 'meeting_sessions')
      .eq('key', 'latest_meeting_session')
      .eq('is_current', true)
      .maybeSingle()

    if (prev) {
      await contextDb
        .from('business_context')
        .update({ is_current: false, superseded_by: null })
        .eq('id', prev.id)
    }

    // 2. Insert new "latest_meeting_session" entry
    const { data: latest } = await contextDb
      .from('business_context')
      .insert({
        category: 'meeting_sessions',
        key: 'latest_meeting_session',
        value: sessionValue,
        metadata: {
          room_id: session.roomId,
          meeting_date: session.meetingDate,
          rating: session.rating,
          todo_completion_rate: todoCompletionRate,
          issue_resolution_rate: issueResolutionRate,
          rock_health_score: rockHealthScore,
        },
        confidence: 1.0,
        source: 'cult-los-app',
        is_current: true,
      })
      .select('id')
      .single()

    // 3. Link supersede chain
    if (prev && latest) {
      await contextDb
        .from('business_context')
        .update({ superseded_by: latest.id })
        .eq('id', prev.id)
    }

    // 4. Also insert a timestamped historical entry (never superseded)
    await contextDb
      .from('business_context')
      .insert({
        category: 'meeting_sessions',
        key: `session_${session.meetingDate}_${session.roomId.slice(0, 8)}`,
        value: sessionValue,
        metadata: {
          room_id: session.roomId,
          meeting_date: session.meetingDate,
          rating: session.rating,
          type: 'historical_record',
        },
        confidence: 1.0,
        source: 'cult-los-app',
        is_current: true,
      })

    console.log('[E4] Meeting session logged to Context DB:', session.meetingDate)
  } catch (err) {
    // Non-blocking: don't fail the meeting recording if Context DB logging fails
    console.warn('[E4] Failed to log meeting session to Context DB:', err)
  }
}
