import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Rock, Todo, ScorecardMetric, ScorecardEntry } from '../types'
import {
  MeetingRoom, RoomMember, PresenceUser, MeetingTimerState,
  SectionId, SECTIONS, MeetingContextType, MeetingSegue, MeetingHeadline
} from '../types/meeting'

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

interface Props {
  roomId: string
  children: ReactNode
}

export function MeetingProvider({ roomId, children }: Props) {
  const { user, profile } = useAuth()
  const [room, setRoom] = useState<MeetingRoom | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [currentSection, setCurrentSection] = useState<SectionId>('segue')
  const [timer, setTimer] = useState<MeetingTimerState | null>(null)
  const [loading, setLoading] = useState(true)

  // Phase 2: Section data state
  const [segues, setSegues] = useState<MeetingSegue[]>([])
  const [headlines, setHeadlines] = useState<MeetingHeadline[]>([])
  const [rocks, setRocks] = useState<Rock[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [scorecardMetrics, setScorecardMetrics] = useState<ScorecardMetric[]>([])
  const [scorecardEntries, setScorecardEntries] = useState<ScorecardEntry[]>([])

  // ─── Load room + members ───
  useEffect(() => {
    if (!roomId) return
    loadRoom()
    loadMembers()
    loadTimer()
    loadSegues()
    loadHeadlines()
    loadRocks()
    loadTodos()
    loadScorecard()
  }, [roomId])

  async function loadRoom() {
    const { data } = await supabase
      .from('meeting_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    setRoom(data)
    setLoading(false)
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('room_members')
      .select('*, profiles(id, full_name, email, avatar_url)')
      .eq('room_id', roomId)
    setMembers(data || [])
  }

  async function loadTimer() {
    const { data } = await supabase
      .from('meeting_timer')
      .select('*')
      .eq('room_id', roomId)
      .single()
    if (data) setTimer(data)
  }

  async function loadSegues() {
    const { data } = await supabase
      .from('meeting_segues')
      .select('*')
      .eq('room_id', roomId)
    setSegues(data || [])
  }

  async function loadHeadlines() {
    const { data } = await supabase
      .from('meeting_headlines')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    setHeadlines(data || [])
  }

  async function loadRocks() {
    const { data } = await supabase
      .from('rocks')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    setRocks(data || [])
  }

  async function loadTodos() {
    const { data } = await supabase
      .from('todos')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    setTodos(data || [])
  }

  async function loadScorecard() {
    const { data: metrics } = await supabase
      .from('scorecard_metrics')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    setScorecardMetrics(metrics || [])

    if (metrics && metrics.length > 0) {
      const metricIds = metrics.map((m: ScorecardMetric) => m.id)
      const { data: entries } = await supabase
        .from('scorecard_entries')
        .select('*')
        .in('metric_id', metricIds)
        .order('week_start', { ascending: false })
      setScorecardEntries(entries || [])
    }
  }

  // ─── Presence tracking ───
  useEffect(() => {
    if (!roomId || !user || !profile) return

    const channel = supabase.channel(`presence:${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[]
          for (const p of presences) {
            users.push({
              user_id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
              online_at: p.online_at,
            })
          }
        }
        setPresence(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            name: profile.full_name || 'Unknown',
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, user, profile])

  // ─── Broadcast channel for timer + section sync ───
  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`meeting:${roomId}`)

    channel
      .on('broadcast', { event: 'timer' }, ({ payload }) => {
        setTimer(payload as MeetingTimerState)
      })
      .on('broadcast', { event: 'section' }, ({ payload }) => {
        setCurrentSection(payload.sectionId as SectionId)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  // ─── Realtime DB changes ───
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`realtime-db:${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meeting_timer',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (payload.new) setTimer(payload.new as MeetingTimerState)
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meeting_segues',
        filter: `room_id=eq.${roomId}`
      }, () => { loadSegues() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meeting_headlines',
        filter: `room_id=eq.${roomId}`
      }, () => { loadHeadlines() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rocks',
        filter: `room_id=eq.${roomId}`
      }, () => { loadRocks() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'todos',
        filter: `room_id=eq.${roomId}`
      }, () => { loadTodos() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'scorecard_entries'
      }, () => { loadScorecard() })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [roomId])

  // ─── Timer controls ───
  const startTimer = useCallback(async (seconds: number) => {
    const expiresAt = new Date(Date.now() + seconds * 1000).toISOString()
    const timerState: MeetingTimerState = {
      room_id: roomId, running: true, expires_at: expiresAt,
      base_seconds: seconds, updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
  }, [roomId])

  const stopTimer = useCallback(async () => {
    const timerState: MeetingTimerState = {
      room_id: roomId, running: false, expires_at: undefined,
      base_seconds: timer?.base_seconds || 0, updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
  }, [roomId, timer])

  const resetTimer = useCallback(async () => {
    const defaultMinutes = room?.timer_duration_minutes || 90
    const timerState: MeetingTimerState = {
      room_id: roomId, running: false, expires_at: undefined,
      base_seconds: defaultMinutes * 60, updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
  }, [roomId, room])

  const handleSetSection = useCallback((sectionId: SectionId) => {
    setCurrentSection(sectionId)
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'section', payload: { sectionId },
    })
  }, [roomId])

  // ─── Phase 2: CRUD operations ───

  const upsertSegue = useCallback(async (personal: string, professional: string) => {
    if (!user) return
    await supabase.from('meeting_segues').upsert({
      room_id: roomId,
      profile_id: user.id,
      personal,
      professional,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'room_id,profile_id' })
  }, [roomId, user])

  const addHeadline = useCallback(async (text: string) => {
    if (!user) return
    await supabase.from('meeting_headlines').insert({
      room_id: roomId,
      profile_id: user.id,
      text,
    })
  }, [roomId, user])

  const toggleHeadline = useCallback(async (id: string, isDone: boolean) => {
    await supabase.from('meeting_headlines').update({ is_done: isDone }).eq('id', id)
  }, [])

  const removeHeadline = useCallback(async (id: string) => {
    await supabase.from('meeting_headlines').delete().eq('id', id)
  }, [])

  const dropHeadlineToIDS = useCallback(async (headline: MeetingHeadline) => {
    // Create an issue from the headline
    await supabase.from('issues').insert({
      room_id: roomId,
      title: headline.text,
      submitted_by_name: members.find(m => m.profile_id === headline.profile_id)?.profiles?.full_name || 'Unknown',
      status: 'open',
      priority: 'medium',
    })
    // Mark headline as dropped to IDS
    await supabase.from('meeting_headlines').update({ dropped_to_ids: true }).eq('id', headline.id)
  }, [roomId, members])

  const cycleRockStatus = useCallback(async (id: string, currentStatus: string) => {
    const next: Record<string, string> = {
      'on_track': 'off_track',
      'off_track': 'complete',
      'complete': 'on_track',
    }
    const newStatus = next[currentStatus] || 'on_track'
    await supabase.from('rocks').update({
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  }, [])

  const addTodo = useCallback(async (title: string, ownerId?: string) => {
    if (!user) return
    await supabase.from('todos').insert({
      room_id: roomId,
      owner_id: ownerId || user.id,
      title,
      status: 'open',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }, [roomId, user])

  const updateTodoStatus = useCallback(async (id: string, status: string) => {
    await supabase.from('todos').update({
      status,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  }, [])

  const addScorecardEntry = useCallback(async (metricId: string, weekStart: string, value: number) => {
    if (!user) return
    await supabase.from('scorecard_entries').upsert({
      metric_id: metricId,
      week_start: weekStart,
      value,
      entered_by: user.id,
    }, { onConflict: 'metric_id,week_start' })
  }, [user])

  return (
    <MeetingContext.Provider value={{
      room, members, presence, currentSection,
      setCurrentSection: handleSetSection,
      timer, startTimer, stopTimer, resetTimer, loading,
      // Phase 2
      segues, headlines, rocks, todos, scorecardMetrics, scorecardEntries,
      upsertSegue, addHeadline, toggleHeadline, removeHeadline, dropHeadlineToIDS,
      cycleRockStatus, addTodo, updateTodoStatus, addScorecardEntry,
    }}>
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeeting() {
  const ctx = useContext(MeetingContext)
  if (!ctx) throw new Error('useMeeting must be used within MeetingProvider')
  return ctx
}
