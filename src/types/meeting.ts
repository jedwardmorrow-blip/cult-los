// L10 Meeting Types

export const SECTIONS = [
  { id: 'segue', label: 'Segue', icon: 'Smile', tip: 'Share one personal and one professional piece of good news.', minutes: 5 },
  { id: 'scorecard', label: 'Scorecard', icon: 'BarChart3', tip: 'Review weekly metrics. Red means action required.', minutes: 5 },
  { id: 'rocks', label: 'Rocks', icon: 'Target', tip: 'Review 90-day rocks: on track, off track, or done.', minutes: 5 },
  { id: 'headlines', label: 'Headlines', icon: 'Newspaper', tip: 'Brief customer or employee news — headlines, not stories.', minutes: 5 },
  { id: 'todos', label: 'To-Dos', icon: 'ListTodo', tip: 'Review action items. Mark complete, add notes, assign new tasks.', minutes: 5 },
  { id: 'ids', label: 'IDS', icon: 'MessageSquare', tip: 'Identify, Discuss, Solve. Work through the top issues until solved.', minutes: 60 },
  { id: 'conclude', label: 'Conclude', icon: 'CheckCircle2', tip: 'Recap to-dos, cascade messages, rate the meeting, and record the session.', minutes: 5 },
] as const

export type SectionId = typeof SECTIONS[number]['id']

export interface MeetingRoom {
  id: string
  business_id?: string
  name: string
  description?: string
  created_by?: string
  timer_duration_minutes: number
  created_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  profile_id: string
  role: 'facilitator' | 'member'
  joined_at: string
  // Joined from profiles
  profiles?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface RoomInvite {
  id: string
  room_id: string
  email: string
  invited_by?: string
  created_at: string
}

export interface RoomSectionConfig {
  id: string
  room_id: string
  section_id: SectionId
  minutes: number
}

export interface MeetingTimerState {
  room_id: string
  running: boolean
  expires_at?: string
  base_seconds: number
  updated_at: string
}

export interface PresenceUser {
  user_id: string
  name: string
  avatar_url?: string
  online_at: string
}

export interface MeetingSegue {
  id: string
  room_id: string
  meeting_id?: string
  profile_id: string
  personal?: string
  professional?: string
  updated_at: string
}

export interface MeetingHeadline {
  id: string
  room_id: string
  meeting_id?: string
  profile_id: string
  text: string
  is_done: boolean
  dropped_to_ids?: boolean
  created_at: string
}

export interface MeetingContextType {
  room: MeetingRoom | null
  members: RoomMember[]
  presence: PresenceUser[]
  currentSection: SectionId
  setCurrentSection: (s: SectionId) => void
  timer: MeetingTimerState | null
  startTimer: (seconds: number) => void
  stopTimer: () => void
  resetTimer: () => void
  loading: boolean
  // Phase 2: Section data
  segues: MeetingSegue[]
  headlines: MeetingHeadline[]
  rocks: import('./index').Rock[]
  todos: import('./index').Todo[]
  scorecardMetrics: import('./index').ScorecardMetric[]
  scorecardEntries: import('./index').ScorecardEntry[]
  // Phase 2: CRUD
  upsertSegue: (personal: string, professional: string) => Promise<void>
  addHeadline: (text: string) => Promise<void>
  toggleHeadline: (id: string, isDone: boolean) => Promise<void>
  removeHeadline: (id: string) => Promise<void>
  dropHeadlineToIDS: (headline: MeetingHeadline) => Promise<void>
  cycleRockStatus: (id: string, currentStatus: string) => Promise<void>
  addTodo: (title: string, ownerId?: string) => Promise<void>
  updateTodoStatus: (id: string, status: string) => Promise<void>
  addScorecardEntry: (metricId: string, weekStart: string, value: number) => Promise<void>
}
