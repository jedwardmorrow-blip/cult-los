export interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  permission_level: 'owner' | 'admin' | 'member'
  is_hidden: boolean
  slack_id?: string
  avatar_url?: string
  is_active: boolean
  google_access_token?: string
  google_refresh_token?: string
  google_token_expires_at?: string
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Plan {
  id: string
  profile_id: string
  business_id?: string
  quarter: string
  start_date: string
  end_date: string
  north_star: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  plan_id: string
  profile_id: string
  phase: 1 | 2 | 3
  title: string
  description?: string
  success_metric?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Rock {
  id: string
  business_id?: string
  room_id?: string
  owner_id?: string
  quarter: string
  title: string
  description?: string
  success_metric?: string
  status: 'on_track' | 'off_track' | 'complete'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  priority?: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
}

export interface ScorecardMetric {
  id: string
  business_id?: string
  room_id?: string
  owner_id?: string
  title: string
  description?: string
  goal_value?: number
  unit?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  is_active: boolean
  created_at: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
}

export interface ScorecardEntry {
  id: string
  metric_id: string
  week_start: string
  value?: number
  notes?: string
  entered_by?: string
  created_at: string
}

export interface Meeting {
  id: string
  business_id?: string
  room_id?: string
  title: string
  meeting_date: string
  facilitator_id?: string
  segue?: string
  scorecard_notes?: string
  rock_review_notes?: string
  headlines?: string
  todos_review_notes?: string
  ids_notes?: string
  conclude_notes?: string
  rating?: number
  status: 'scheduled' | 'in_progress' | 'completed'
  current_section?: string
  discussing_issue_id?: string
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  business_id?: string
  room_id?: string
  reported_by?: string
  owner_id?: string
  meeting_id?: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_discussion' | 'resolved' | 'dropped'
  resolution?: string
  resolution_draft?: string
  solution?: string
  submitted_by_name?: string
  sort_order?: number
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  business_id?: string
  room_id?: string
  owner_id?: string
  meeting_id?: string
  title: string
  due_date?: string
  status: 'open' | 'in_progress' | 'stuck' | 'complete' | 'dropped'
  assignee_name?: string
  from_issue_id?: string
  completed_at?: string
  created_at: string
  updated_at: string
  priority?: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
  // D2: Multi-assignee
  assignees?: Array<{ id: string; full_name: string; avatar_url?: string }>
}

export interface Checkin {
  id: string
  profile_id: string
  plan_id?: string
  week_start: string
  wins?: string
  challenges?: string
  priorities?: string
  rating?: number
  submitted_at: string
}

// ââ Phase 5: Personal Todos ââ

export interface PersonalTodo {
  id: string
  owner_id: string
  title: string
  description?: string
  due_date?: string
  is_recurring: boolean
  recurrence_pattern?: 'daily' | 'weekdays' | 'weekly' | 'monthly'
  status: 'pending' | 'complete' | 'dropped'
  completed_at?: string
  sort_order: number
  priority?: string
  category?: string
  created_at: string
  updated_at: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
  // D2: Multi-assignee
  assignees?: Array<{ id: string; full_name: string; avatar_url?: string }>
  // Virtual: for recurring items, today's completion
  completed_today?: boolean
}

export interface PersonalTodoCompletion {
  id: string
  todo_id: string
  completed_date: string
  completed_at: string
}

// ── Phase D: Cross-Functional Assignment ──

export interface TodoAssignee {
  id: string
  todo_id: string
  profile_id: string
  assigned_at: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
}

export interface PersonalTodoAssignee {
  id: string
  todo_id: string
  profile_id: string
  assigned_at: string
  // Joined
  profiles?: { id: string; full_name: string; avatar_url?: string }
}

// ── Phase G: Google Calendar Sync ──

export interface MeetingSchedule {
  id: string
  room_id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  recurrence: 'none' | 'weekly' | 'biweekly' | 'monthly'
  google_event_id?: string
  ics_uid?: string
  created_by?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
  // Joined
  meeting_rooms?: { id: string; name: string }
  profiles?: { id: string; full_name: string }
}

export interface ClaudeRecommendation {
  id: string
  target_type: string
  target_id: string | null
  owner_id: string | null
  title: string
  recommendation: string
  priority_level: string
  reasoning: string | null
  category: string | null
  source_session: string | null
  status: string
  created_at: string | null
  expires_at: string | null
  dismissed_at: string | null
  acted_on_at: string | null
}
