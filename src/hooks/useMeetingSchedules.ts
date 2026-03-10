import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { MeetingSchedule } from '../types'

export function useMeetingSchedules(roomId?: string) {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('meeting_schedules')
      .select('*, meeting_rooms(id, name), profiles(id, full_name)')
      .is('cancelled_at', null)
      .order('scheduled_at', { ascending: true })

    if (roomId) {
      query = query.eq('room_id', roomId)
    }

    const { data, error } = await query
    if (error) console.error('Fetch schedules error:', error)
    setSchedules((data || []) as MeetingSchedule[])
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Realtime
  useEffect(() => {
    const filter = roomId ? { filter: `room_id=eq.${roomId}` } : {}
    const channel = supabase
      .channel('meeting-schedules-' + (roomId || 'all'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_schedules', ...filter },
        () => fetchSchedules()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, fetchSchedules])

  // G2: Schedule a new meeting
  const scheduleMeeting = useCallback(async (params: {
    room_id: string
    title: string
    scheduled_at: string
    duration_minutes?: number
    recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly'
  }) => {
    if (!user?.id) return null

    const { data, error } = await supabase
      .from('meeting_schedules')
      .insert({
        room_id: params.room_id,
        title: params.title,
        scheduled_at: params.scheduled_at,
        duration_minutes: params.duration_minutes || 90,
        recurrence: params.recurrence || 'none',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Schedule meeting error:', error)
      return null
    }

    // G3: Create Google Calendar event for all room members (non-blocking)
    if (data) {
      supabase.functions.invoke('gcal-create-event', {
        body: {
          schedule_id: data.id,
          room_id: params.room_id,
          title: params.title,
          scheduled_at: params.scheduled_at,
          duration_minutes: params.duration_minutes || 90,
          created_by: user.id,
        },
      }).catch(err => console.warn('[G3] Calendar event creation failed:', err))
    }

    return data
  }, [user?.id])

  // G4: Reschedule a meeting
  const rescheduleMeeting = useCallback(async (
    scheduleId: string,
    newScheduledAt: string,
    newDuration?: number
  ) => {
    const updates: Record<string, unknown> = {
      scheduled_at: newScheduledAt,
      updated_at: new Date().toISOString(),
    }
    if (newDuration) updates.duration_minutes = newDuration

    const { error } = await supabase
      .from('meeting_schedules')
      .update(updates)
      .eq('id', scheduleId)

    if (error) {
      console.error('Reschedule error:', error)
      return false
    }

    // G4: Sync update to Google Calendar (non-blocking)
    supabase.functions.invoke('gcal-update-event', {
      body: { schedule_id: scheduleId, scheduled_at: newScheduledAt, duration_minutes: newDuration },
    }).catch(err => console.warn('[G4] Calendar update failed:', err))

    return true
  }, [])

  // G4: Cancel a meeting
  const cancelMeeting = useCallback(async (scheduleId: string) => {
    const { error } = await supabase
      .from('meeting_schedules')
      .update({ cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', scheduleId)

    if (error) {
      console.error('Cancel meeting error:', error)
      return false
    }

    // G4: Remove from Google Calendar (non-blocking)
    supabase.functions.invoke('gcal-update-event', {
      body: { schedule_id: scheduleId, cancel: true },
    }).catch(err => console.warn('[G4] Calendar cancel failed:', err))

    return true
  }, [])

  // Get upcoming schedules (next N)
  const upcoming = schedules.filter(s => new Date(s.scheduled_at) >= new Date())

  return {
    schedules,
    upcoming,
    loading,
    scheduleMeeting,
    rescheduleMeeting,
    cancelMeeting,
    refetch: fetchSchedules,
  }
}
