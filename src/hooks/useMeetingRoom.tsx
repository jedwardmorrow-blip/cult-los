import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import {
  MeetingRoom, RoomMember, PresenceUser, MeetingTimerState,
  SectionId, SECTIONS, MeetingContextType
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

  useEffect(() => {
    if (!roomId) return
    loadRoom()
    loadMembers()
    loadTimer()
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

  useEffect(() => {
    if (!roomId || !user || !profile) return
    const channel = supabase.channel('presence:' + roomId)
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
    return () => { channel.unsubscribe() }
  }, [roomId, user, profile])

  useEffect(() => {
    if (!roomId) return
    const channel = supabase.channel('meeting:' + roomId)
    channel
      .on('broadcast', { event: 'timer' }, ({ payload }) => {
        setTimer(payload as MeetingTimerState)
      })
      .on('broadcast', { event: 'section' }, ({ payload }) => {
        setCurrentSection(payload.sectionId as SectionId)
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    const channel = supabase
      .channel('timer-db:' + roomId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_timer',
        filter: 'room_id=eq.' + roomId
      }, (payload) => {
        if (payload.new) setTimer(payload.new as MeetingTimerState)
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [roomId])

  const startTimer = useCallback(async (seconds: number) => {
    const expiresAt = new Date(Date.now() + seconds * 1000).toISOString()
    const timerState: MeetingTimerState = {
      room_id: roomId,
      running: true,
      expires_at: expiresAt,
      base_seconds: seconds,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel('meeting:' + roomId).send({
      type: 'broadcast',
      event: 'timer',
      payload: timerState,
    })
  }, [roomId])

  const stopTimer = useCallback(async () => {
    const timerState: MeetingTimerState = {
      room_id: roomId,
      running: false,
      expires_at: undefined,
      base_seconds: timer?.base_seconds || 0,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel('meeting:' + roomId).send({
      type: 'broadcast',
      event: 'timer',
      payload: timerState,
    })
  }, [roomId, timer])

  const resetTimer = useCallback(async () => {
    const defaultMinutes = room?.timer_duration_minutes || 90
    const timerState: MeetingTimerState = {
      room_id: roomId,
      running: false,
      expires_at: undefined,
      base_seconds: defaultMinutes * 60,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel('meeting:' + roomId).send({
      type: 'broadcast',
      event: 'timer',
      payload: timerState,
    })
  }, [roomId, room])

  const handleSetSection = useCallback((sectionId: SectionId) => {
    setCurrentSection(sectionId)
    supabase.channel('meeting:' + roomId).send({
      type: 'broadcast',
      event: 'section',
      payload: { sectionId },
    })
  }, [roomId])

  return (
    <MeetingContext.Provider value={{
      room, members, presence, currentSection,
      setCurrentSection: handleSetSection,
      timer, startTimer, stopTimer, resetTimer, loading,
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
