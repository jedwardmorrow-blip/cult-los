import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Rock, Todo, Issue, ScorecardMetric, ScorecardEntry } from '../types'
import {
  MeetingRoom, RoomMember, PresenceUser, MeetingTimerState,
  SectionId, SECTIONS, MeetingContextType, MeetingSegue, MeetingHeadline,
  IssueVote, IssueNote
} from '../types/meeting'
import { logMeetingSession } from '../lib/contextDbLogger'

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

  // Phase 3: IDS state
  const [issues, setIssues] = useState<Issue[]>([])
  const [issueVotes, setIssueVotes] = useState<IssueVote[]>([])
  const [issueNotes, setIssueNotes] = useState<IssueNote[]>([])
  const [discussingIssueId, setDiscussingIssueId] = useState<string | null>(null)

  // Phase 4: Conclude state
  const [concludeRating, setConcludeRating] = useState<number | null>(null)
  const [concludeCascading, setConcludeCascading] = useState('')
  // A20: Meeting streak
  const [meetingStreak, setMeetingStreak] = useState(0)

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
    loadIssues()
    loadIssueVotes()
    loadIssueNotes()
    loadStreak()
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

  // A20: Load meeting streak — consecutive weeks with a recorded session
  async function loadStreak() {
    const { data: sessions } = await supabase
      .from('meeting_sessions')
      .select('meeting_date')
      .eq('room_id', roomId)
      .order('meeting_date', { ascending: false })
      .limit(52) // max 1 year of weekly meetings
    if (!sessions || sessions.length === 0) { setMeetingStreak(0); return }

    let streak = 1
    for (let i = 0; i < sessions.length - 1; i++) {
      const curr = new Date(sessions[i].meeting_date)
      const prev = new Date(sessions[i + 1].meeting_date)
      const daysBetween = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      // Allow 5–10 day gap for weekly meetings (accounts for schedule drift)
      if (daysBetween <= 10) {
        streak++
      } else {
        break
      }
    }
    setMeetingStreak(streak)
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

  async function loadIssues() {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true })
    setIssues(data || [])
  }

  async function loadIssueVotes() {
    // Load all votes for issues in this room
    const { data: roomIssues } = await supabase
      .from('issues')
      .select('id')
      .eq('room_id', roomId)
    if (!roomIssues || roomIssues.length === 0) { setIssueVotes([]); return }
    const issueIds = roomIssues.map(i => i.id)
    const { data } = await supabase
      .from('issue_votes')
      .select('*')
      .in('issue_id', issueIds)
    setIssueVotes(data || [])
  }

  async function loadIssueNotes() {
    const { data: roomIssues } = await supabase
      .from('issues')
      .select('id')
      .eq('room_id', roomId)
    if (!roomIssues || roomIssues.length === 0) { setIssueNotes([]); return }
    const issueIds = roomIssues.map(i => i.id)
    const { data } = await supabase
      .from('issue_notes')
      .select('*, profiles(full_name)')
      .in('issue_id', issueIds)
      .order('created_at', { ascending: true })
    setIssueNotes(data || [])
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

  // ─── Broadcast channel for timer + section + IDS discussing sync ───
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
      .on('broadcast', { event: 'discussing' }, ({ payload }) => {
        setDiscussingIssueId(payload.issueId || null)
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
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'issues',
        filter: `room_id=eq.${roomId}`
      }, () => { loadIssues() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'issue_votes'
      }, () => { loadIssueVotes() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'issue_notes'
      }, () => { loadIssueNotes() })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [roomId])

  // ─── Timer controls ───
  const startTimer = useCallback(async (seconds: number) => {
    const wasRunning = timer?.running
    const expiresAt = new Date(Date.now() + seconds * 1000).toISOString()
    const timerState: MeetingTimerState = {
      room_id: roomId, running: true, expires_at: expiresAt,
      base_seconds: seconds, updated_at: new Date().toISOString(),
    }
    // Update local state immediately (don't rely solely on realtime)
    setTimer(timerState)
    await supabase.from('meeting_timer').upsert(timerState)
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
    // F4: Notify room members via Slack when meeting starts (not on resume)
    if (!wasRunning && user) {
      supabase.functions.invoke('slack-meeting-start', {
        body: { room_id: roomId, started_by: user.id },
      }).catch(err => console.warn('[F4] Slack meeting start notify failed:', err))
    }
  }, [roomId, timer, user])

  const stopTimer = useCallback(async () => {
    const remaining = timer?.expires_at
      ? Math.max(0, Math.floor((new Date(timer.expires_at).getTime() - Date.now()) / 1000))
      : timer?.base_seconds || 0
    const timerState: MeetingTimerState = {
      room_id: roomId, running: false,
      base_seconds: remaining, updated_at: new Date().toISOString(),
    }
    // Update local state immediately
    setTimer(timerState)
    await supabase.from('meeting_timer').upsert({
      ...timerState, expires_at: null,
    })
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
  }, [roomId, timer])

  const resetTimer = useCallback(async () => {
    const defaultMinutes = room?.timer_duration_minutes || 90
    const timerState: MeetingTimerState = {
      room_id: roomId, running: false,
      base_seconds: defaultMinutes * 60, updated_at: new Date().toISOString(),
    }
    // Update local state immediately
    setTimer(timerState)
    await supabase.from('meeting_timer').upsert({
      ...timerState, expires_at: null,
    })
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'timer', payload: timerState,
    })
  }, [roomId, room])

  // ─── Update room duration ───
  const updateRoomDuration = useCallback(async (minutes: number) => {
    if (!room) return
    await supabase.from('meeting_rooms').update({ timer_duration_minutes: minutes }).eq('id', roomId)
    setRoom({ ...room, timer_duration_minutes: minutes })
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
    const targetOwner = ownerId || user.id
    await supabase.from('todos').insert({
      room_id: roomId,
      owner_id: targetOwner,
      title,
      status: 'open',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    // F2: Notify assigned user via Slack DM (non-blocking, skip self)
    if (targetOwner !== user.id) {
      supabase.functions.invoke('slack-todo-notify', {
        body: {
          todo_title: title,
          todo_type: 'team',
          assignee_ids: [targetOwner],
          assigned_by: user.id,
          room_name: room?.name,
        },
      }).catch(err => console.warn('[F2] Slack todo notify failed:', err))
    }
  }, [roomId, room, user])

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

  // ─── Phase 3: IDS CRUD operations ───

  const addIssue = useCallback(async (title: string, description?: string, priority?: string) => {
    if (!user || !profile) return
    const maxOrder = issues.reduce((max, i) => Math.max(max, i.sort_order || 0), 0)
    await supabase.from('issues').insert({
      room_id: roomId,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'open',
      submitted_by_name: profile.full_name || 'Unknown',
      sort_order: maxOrder + 1,
    })
  }, [roomId, user, profile, issues])

  const voteIssue = useCallback(async (issueId: string) => {
    if (!user) return
    // Toggle: if already voted, remove vote; otherwise add vote
    const existing = issueVotes.find(v => v.issue_id === issueId && v.profile_id === user.id)
    if (existing) {
      await supabase.from('issue_votes').delete().eq('id', existing.id)
    } else {
      await supabase.from('issue_votes').insert({
        issue_id: issueId,
        profile_id: user.id,
      })
    }
  }, [user, issueVotes])

  const setDiscussing = useCallback((issueId: string | null) => {
    setDiscussingIssueId(issueId)
    // Broadcast to other participants
    supabase.channel(`meeting:${roomId}`).send({
      type: 'broadcast', event: 'discussing', payload: { issueId },
    })
  }, [roomId])

  const updateIssueDraft = useCallback(async (issueId: string, draft: string) => {
    await supabase.from('issues').update({
      resolution_draft: draft,
      updated_at: new Date().toISOString(),
    }).eq('id', issueId)
  }, [])

  const solveIssue = useCallback(async (issueId: string, solution: string) => {
    await supabase.from('issues').update({
      status: 'resolved',
      solution,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', issueId)
    // If this was the discussing issue, clear it
    if (discussingIssueId === issueId) {
      setDiscussing(null)
    }
  }, [discussingIssueId, setDiscussing])

  const addIssueNote = useCallback(async (issueId: string, text: string) => {
    if (!user) return
    await supabase.from('issue_notes').insert({
      issue_id: issueId,
      profile_id: user.id,
      text,
    })
  }, [user])

  const issueToTodo = useCallback(async (issue: Issue) => {
    if (!user) return
    await supabase.from('todos').insert({
      room_id: roomId,
      owner_id: user.id,
      title: issue.title,
      status: 'open',
      from_issue_id: issue.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }, [roomId, user])

  // ─── Phase 4: Conclude ───

  const recordSession = useCallback(async () => {
    if (!user) return
    const todoTotal = todos.length
    const todoCompleted = todos.filter(t => t.status === 'complete').length
    const rockOnTrack = rocks.filter(r => r.status === 'on_track').length
    const rockOffTrack = rocks.filter(r => r.status === 'off_track').length
    const rockDone = rocks.filter(r => r.status === 'complete').length
    const issueTotal = issues.length
    const issueResolved = issues.filter(i => i.status === 'resolved').length
    const attendeeIds = presence.map(p => p.user_id)
    const meetingDate = new Date().toISOString().split('T')[0]
    await supabase.from('meeting_sessions').insert({
      room_id: roomId,
      meeting_date: meetingDate,
      rating: concludeRating,
      cascading_messages: concludeCascading,
      todo_stats: { total: todoTotal, completed: todoCompleted },
      rock_stats: { onTrack: rockOnTrack, offTrack: rockOffTrack, done: rockDone },
      issue_stats: { total: issueTotal, resolved: issueResolved },
      attendees: attendeeIds,
      recorded_by: user.id,
    })
    // E4: Log session summary to Context DB (non-blocking)
    logMeetingSession({
      roomId,
      roomName: room?.name,
      meetingDate,
      rating: concludeRating,
      cascadingMessages: concludeCascading,
      todoStats: { total: todoTotal, completed: todoCompleted },
      rockStats: { onTrack: rockOnTrack, offTrack: rockOffTrack, done: rockDone },
      issueStats: { total: issueTotal, resolved: issueResolved },
      attendeeCount: attendeeIds.length,
      recordedBy: user.id,
    })
    // F1: Post recap to Slack (non-blocking)
    if (room?.slack_channel_id) {
      supabase.functions.invoke('slack-meeting-recap', {
        body: {
          room_id: roomId,
          meeting_date: meetingDate,
          rating: concludeRating,
          cascading_messages: concludeCascading,
          todo_stats: { total: todoTotal, completed: todoCompleted },
          rock_stats: { onTrack: rockOnTrack, offTrack: rockOffTrack, done: rockDone },
          issue_stats: { total: issueTotal, resolved: issueResolved },
          attendees: attendeeIds,
          recorded_by: user.id,
        },
      }).catch(err => console.warn('[F1] Slack recap failed:', err))
    }
    setConcludeRating(null)
    setConcludeCascading('')
    // A20: Reload streak after recording
    loadStreak()
  }, [roomId, room, user, todos, rocks, issues, presence, concludeRating, concludeCascading])

  // A17: Reset meeting — clear transient session data
  const resetMeeting = useCallback(async () => {
    // Clear segues
    await supabase.from('meeting_segues').delete().eq('room_id', roomId)
    // Clear headlines
    await supabase.from('meeting_headlines').delete().eq('room_id', roomId)
    // Reset conclude state
    setConcludeRating(null)
    setConcludeCascading('')
    // Reset section to segue
    handleSetSection('segue')
    // Reset timer
    await resetTimer()
    // Reload cleared data
    loadSegues()
    loadHeadlines()
  }, [roomId, handleSetSection, resetTimer])

  return (
    <MeetingContext.Provider value={{
      room, members, presence, currentSection,
      setCurrentSection: handleSetSection,
      timer, startTimer, stopTimer, resetTimer, loading,
      // Phase 2
      segues, headlines, rocks, todos, scorecardMetrics, scorecardEntries,
      upsertSegue, addHeadline, toggleHeadline, removeHeadline, dropHeadlineToIDS,
      cycleRockStatus, addTodo, updateTodoStatus, addScorecardEntry,
      // Phase 3: IDS
      issues, issueVotes, issueNotes, discussingIssueId,
      addIssue, voteIssue, setDiscussing, updateIssueDraft,
      solveIssue, addIssueNote, issueToTodo,
      // Phase 4: Conclude
      concludeRating, concludeCascading,
      setConcludeRating, setConcludeCascading, recordSession,
      resetMeeting, meetingStreak, updateRoomDuration,
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
