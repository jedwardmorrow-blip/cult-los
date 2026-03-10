# CULT-LOS Development Plan

> **Created:** 2026-03-10
> **Project:** CULT Leadership Operating System
> **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase
> **Supabase Project:** `blcvkropuiadheukhniu`
> **Context DB:** `uayyhluztelnfxfvdhyt`
> **GitHub:** `jedwardmorrow-blip/cult-los` (main branch)
> **Deployment:** `cult-los.vercel.app`

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [User Profile Status](#2-user-profile-status)
3. [L-10 Feature Parity — Original HTML vs Current](#3-l-10-feature-parity)
4. [New Feature Requests](#4-new-feature-requests)
5. [Architecture & Schema Notes](#5-architecture--schema-notes)
6. [Implementation Phases](#6-implementation-phases)

---

## 1. Current State Assessment

### App Structure (49 source files, ~5,500 lines)

The app is organized as a React SPA with Supabase backend. Core routes:

| Route | Page | Status |
|-------|------|--------|
| `/dashboard` | DashboardPage | ✅ Working |
| `/plan` | PlanPage | ✅ Working |
| `/team` | TeamPage | ✅ Working |
| `/issues` | IssuesPage | ✅ Working |
| `/todos` | TodosPage | ✅ Working |
| `/my-todos` | PersonalTodosPage | ✅ Working |
| `/rocks` | RocksPage | ✅ Working |
| `/rooms` | RoomsPage | ✅ Working |
| `/meeting/:roomId` | MeetingRoom | ✅ Working |
| `/calendar` | CalendarPage | ✅ Working |
| `/analytics` | AnalyticsPage | ✅ Working |
| `/vto` | VTOPage | ✅ Working |
| `/claude` | ClaudeAIPage | ✅ Working |
| `/admin` | AdminPanel | ✅ Working |

### Supabase Tables (26 total)

`profiles`, `businesses`, `plans`, `goals`, `rocks`, `scorecard_metrics`, `scorecard_entries`, `meetings`, `meeting_rooms`, `meeting_sessions`, `meeting_segues`, `meeting_headlines`, `meeting_timer`, `room_members`, `room_invites`, `room_section_config`, `issues`, `issue_votes`, `issue_notes`, `todos`, `personal_todos`, `personal_todo_completions`, `checkins`, `staff_priorities`, `claude_recommendations`, `admin_audit_log`

### Design System

- Dark luxury theme: `cult-dark` (#0A0A0A), `cult-surface` (#141414), `cult-border` (#1F1F1F)
- Gold accent: `cult-gold` (#C8A84B)
- Fonts: Bebas Neue (display), DM Sans (body), JetBrains Mono (mono)
- Status colors: `cult-green-bright`, `cult-amber-bright`, `cult-red-bright`

### Permission Model

`owner` > `admin` > `member` hierarchy. Utils in `lib/permissions.ts` and hook in `hooks/usePermissions.ts`. Admin/owner can manage users, room members, view all todos, assign todos.

---

## 2. User Profile Status

All profiles verified correct as of 2026-03-10:

| Name | Email | Role | Permission | Status |
|------|-------|------|------------|--------|
| Justin Morrow | justin@cultcannabis.co | CEO | owner | ✅ Active |
| Scott Tucker | scott@cultcannabis.co | COO_CFO | member | ✅ Active |
| Sam Dockery | sam@cultcannabis.co | Chief_of_Staff | member | ✅ Active |
| Andrew Mason | andrew@cultcannabis.co | Director_of_Cultivation | member | ✅ Active |
| Leo Groulx | leo@cultcannabis.co | Director_of_Sales | member | ✅ Active |

- [x] All emails are @cultcannabis.co (Google Auth ready)
- [x] Andrew Mason title updated to Director_of_Cultivation
- [x] Old Justin account (jedwardmorrow@gmail.com) marked inactive
- [x] Google OAuth configured with `hd: 'cultcannabis.co'` restriction

---

## 3. L-10 Feature Parity

Comparing original `eos-level10-live.html` (2401 lines, Firebase) against current implementation.

### 3.1 Core Meeting Infrastructure

- [x] Room creation with name/description
- [x] Room member management (facilitator/member roles)
- [x] 7-section meeting flow (segue → scorecard → rocks → headlines → todos → IDS → conclude)
- [x] Section navigation with clickable tabs
- [x] Keyboard shortcuts (arrow keys + 1-7 number keys)
- [x] Section timer with default minutes per section
- [x] Configurable section durations (`room_section_config` table)
- [x] Presence tracking (who's online in the room)
- [x] **Eye flash transition between sections** — ✅ Phase A2
- [x] **EOS tips per section** — ✅ Phase A3

### 3.2 Timer System

- [x] Start/pause/reset timer
- [x] Preset durations (30/45/60/75/90/120 min)
- [x] Custom duration input
- [x] Realtime sync across all participants (Supabase broadcast)
- [x] Timer expires visual (red + pulse animation)
- [x] Warning state (amber when < 60s)
- [x] **Timer gradient color system** — ✅ Phase A4
- [x] **Timer progress bar** — ✅ Phase A5
- [x] **Timer settings modal with schedule** — ✅ Phase G2

### 3.3 Segue Section

- [x] Per-member personal + professional good news cards
- [x] Avatar and online status indicator
- [x] Edit/save functionality with upsert
- [x] All members displayed in grid layout
- [x] **Segue completion indicator** — ✅ Phase A11

### 3.4 Scorecard Section

- [x] Metrics table with title, goal, owner
- [x] 4-week Monday-based history columns
- [x] Inline value editing
- [x] Green/red goal comparison coloring
- [x] **Scorecard trend arrows** — ✅ Phase A7
- [x] **Scorecard notes per entry** — ✅ Phase A8

### 3.5 Rocks Section

- [x] Status cycling: on_track → off_track → complete
- [x] Owner display with avatar
- [x] Due date display
- [x] Description field
- [x] Summary bar (on track / off track / done counts)
- [x] **Confetti on rock completion** — ✅ Phase A6
- [ ] **Rock progress percentage** — Original shows a percentage bar for each rock. Current: only status badges.

### 3.6 Headlines Section

- [x] Add headline with creator attribution
- [x] Toggle done/undone
- [x] Drop headline to IDS (creates issue)
- [x] Remove headline
- [x] Active/discussed split view
- [x] Creator name display

### 3.7 Todos Section

- [x] Status cycling: open → in_progress → complete
- [x] Owner assignment with avatar
- [x] Due date display
- [x] Overdue detection and visual warning
- [x] Quick-add new todo
- [x] Floating todo panel (FAB button, open count badge, slide-out)
- [x] **Todo owner filter/view toggle** — ✅ Phase A9
- [x] **Todo completion percentage** — ✅ Phase A10

### 3.8 IDS Section (Identify, Discuss, Solve)

- [x] Add issue with title, description, priority
- [x] Voting system (click to vote/unvote)
- [x] Sort by vote count
- [x] Discussing highlight (gold border, expanded view)
- [x] Discussion notes per issue
- [x] Solve flow with solution text
- [x] Issue-to-Todo conversion
- [x] Priority badges (low/medium/high/critical)
- [x] Resolved/open split
- [ ] **IDS drag-to-reorder** — Original allows manual reordering of issues by drag. Current: sorted by votes only.
- [x] **IDS time-spent tracking** — ✅ Phase A12

### 3.9 Conclude Section

- [x] Stats summary (todos, rocks, issues)
- [x] Open todos list
- [x] Cascading messages textarea
- [x] 1-10 meeting rating (star buttons)
- [x] Copy recap to clipboard
- [x] Record session (saves to `meeting_sessions`)
- [x] **Confetti on session record** — ✅ Phase A6
- [x] **Slack recap posting** — ✅ Phase F1
- [x] **Meeting streak counter** — ✅ Phase A20
- [x] **Attendee recording** — ✅ Phase A13

### 3.10 Session History & Export

- [x] **Session history page** — ✅ Phase A14
- [x] **Session filtering/search** — ✅ Phase A15
- [x] **Session transcript/recap export** — ✅ Phase A16

### 3.11 Admin & Settings

- [x] Admin panel with Team Overview, Users, Audit Log
- [x] Room member add/remove (Edge Function)
- [x] Permission-gated admin access
- [x] Profile management
- [x] **Reset session modal** — ✅ Phase A17
- [x] **Room deletion/archiving** — ✅ Phase A18

### 3.12 Polish & UX

- [x] **Toast notification system** — ✅ Phase A1
- [ ] **Loading states per section** — Original shows section-specific loading. Current: initial loading only.
- [ ] **Empty state illustrations** — Original has custom empty states per section. Current: basic "no data" text.
- [x] **Responsive mobile layout** — ✅ Phase A19

---

## 4. New Feature Requests

### 4.1 Admin Team Visibility

**Requirement:** Admin/owner sees team calendars, todos, and checklists for all users. Can add todos and checklist items for other users.

- [x] Admin can view all personal todos (Team View toggle on PersonalTodosPage)
- [x] Admin can assign todos to others (AssignTodoModal with priority, recurring, due date)
- [x] **Admin calendar view showing all team members' items** — ✅ Phase C1
- [x] **Admin quick-assign from calendar view** — ✅ Phase C2

### 4.2 Calendar Checklist Integration

**Requirement:** Users can mark checklist items complete directly from calendar view.

- [x] **Clickable todo/checklist items on calendar** — ✅ Phase C3
- [x] **Calendar day detail panel with completion** — ✅ Phase C4

### 4.3 Prioritization System

**Requirement:** Clear system for how todos and checklist items get prioritized.

- [x] `priority` field exists on `todos`, `personal_todos`, `issues` tables
- [x] `usePersonalTodos` hook `addTodo` accepts priority parameter
- [x] AssignTodoModal exposes priority selector (low/medium/high/critical)
- [x] **Priority in PersonalTodosPage add form** — ✅ Phase B1
- [x] **Priority badges in todo lists** — ✅ Phase B2
- [x] **Priority-based sorting** — ✅ Phase B3
- [x] **Overdue + priority escalation** — ✅ Phase B8

### 4.4 Categorization System

**Requirement:** Categorize todos and checklist items. Context DB currently has NO LOS-specific categories.

**Proposed categories** (for both personal todos and meeting todos):

| Category | Description |
|----------|-------------|
| `operations` | Day-to-day operational tasks |
| `cultivation` | Grow/production related |
| `sales` | Sales and client tasks |
| `finance` | Financial/accounting tasks |
| `compliance` | Regulatory/legal compliance |
| `marketing` | Marketing and branding |
| `hr` | People/team/hiring tasks |
| `technology` | Tech/systems/software |
| `strategic` | Long-term strategic initiatives |
| `general` | Uncategorized |

- [x] **Add `category` column to `personal_todos` table** — ✅ Phase B4
- [x] **Add `category` column to `todos` table** — ✅ Phase B4
- [x] **Category selector in add/assign forms** — ✅ Phase B5
- [x] **Category filter chips** — ✅ Phase B6
- [x] **Category color coding** — ✅ Phase B7
- [x] **Seed categories into Claude Context DB** — ✅ Phase E3

### 4.5 Claude AI Priority Recommendations

**Requirement:** Users can check what should be done first based on Claude Context DB interactions.

- [x] `claude_recommendations` table exists with target_type, priority_level, category, reasoning
- [x] `useClaudeRecommendations` hook with fetch/dismiss/markActedOn
- [x] ClaudeRecommendations component with priority config and category icons
- [x] **Dashboard placement** — ✅ Phase E1
- [x] **Context DB bridge refinement** — ✅ Phase E7
- [x] **"Ask Claude" button** — ✅ Phase E2
- [x] **Recommendation reasoning display** — ✅ Phase E6

### 4.6 Slack Integration

**Requirement:** Potential Slack integrations for LOS.

The Slack bot infrastructure already exists (Vercel serverless + Claude API + Supabase context loader). Slack IDs are stored on profiles.

- [x] **L-10 meeting recap to Slack** — ✅ Phase F1
- [x] **Todo assignment notifications** — ✅ Phase F2
- [x] **Overdue reminders** — ✅ Phase F3
- [x] **Meeting start notification** — ✅ Phase F4
- [x] **Daily standup digest** — ✅ Phase F5

### 4.7 Cross-Functional Task Assignment

**Requirement:** Assign tasks/todos to multiple users. @mention support. Shows on every assigned user's profile.

- [x] **Multi-assignee support** — Junction tables `todo_assignees` and `personal_todo_assignees` with RLS. Co-assignee picker in AssignTodoModal.
- [x] **@mention in task descriptions** — `MentionText` component parses `@name` mentions and renders as styled gold spans.
- [x] **Cross-department task view** — `useAssignedToMeTodos` hook + "Assigned to Me" section on personal dashboard shows tasks from other owners.
- [x] **Assignee avatars** — `AvatarStack` component shows overlapping avatars with initials fallback and overflow indicator.

### 4.8 L-10 Home Screen Placement

**Requirement:** L-10s live in a distinct/separate area on the Home Screen.

- [x] **Dashboard L-10 section** — ✅ Phase C5
- [x] **Quick-enter meeting button** — ✅ Phase C5
- [x] **Upcoming meetings widget** — ✅ Phase C6

### 4.9 Google Calendar Sync

**Requirement:** L-10 meetings scheduled in app show on each assigned user's Google Calendar.

- [x] **Google Calendar OAuth scope** — ✅ Phase G1
- [x] **Meeting scheduling flow** — ✅ Phase G2
- [x] **Calendar event creation** — ✅ Phase G3
- [x] **Calendar event updates** — ✅ Phase G4
- [x] **ICS fallback** — ✅ Phase G5

### 4.10 Claude ↔ App ↔ Context DB Workflow

**Requirement:** Clean, intelligent, consistent workflow between app priority setting, Claude, and Claude Context DB.

- [x] **Session logging on meeting record** — ✅ Phase E4
- [x] **Todo completion tracking** — ✅ Phase E7
- [x] **Priority pattern analysis** — ✅ Phase E5
- [x] **Context DB category seeding** — ✅ Phase E3
- [x] **Bi-directional sync** — ✅ Phase E7

---

## 5. Architecture & Schema Notes

### Needed Database Migrations

```sql
-- 1. Add category to personal_todos (if not exists)
ALTER TABLE personal_todos ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- 2. Add category to todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- 3. Multi-assignee junction table
CREATE TABLE IF NOT EXISTS todo_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid REFERENCES todos(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(todo_id, profile_id)
);

-- 4. Personal todo multi-assignee junction
CREATE TABLE IF NOT EXISTS personal_todo_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid REFERENCES personal_todos(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(todo_id, profile_id)
);

-- 5. Meeting schedule table
CREATE TABLE IF NOT EXISTS meeting_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES meeting_rooms(id) ON DELETE CASCADE,
  recurrence text, -- 'weekly', 'biweekly', 'monthly'
  day_of_week int, -- 0=Sun..6=Sat
  start_time time,
  duration_minutes int DEFAULT 90,
  google_calendar_event_id text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 6. RLS policies for new tables
ALTER TABLE todo_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_todo_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_schedules ENABLE ROW LEVEL SECURITY;
```

### Edge Functions Needed

| Function | Purpose |
|----------|---------|
| `context-db-bridge` (update) | Refine to generate priority recommendations from LOS data |
| `slack-meeting-recap` (new) | Post formatted recap to Slack when session recorded |
| `slack-todo-notify` (new) | DM users when assigned a new todo |
| `gcal-sync` (new) | Create/update Google Calendar events for scheduled meetings |
| `claude-recommendations` (new) | Analyze patterns, generate priority recommendations |

### Key File Locations

| Concern | File(s) |
|---------|---------|
| Auth + Profile | `hooks/useAuth.tsx` |
| Permissions | `hooks/usePermissions.ts`, `lib/permissions.ts` |
| Meeting Context | `hooks/useMeetingRoom.tsx` |
| Personal Todos | `hooks/usePersonalTodos.ts` |
| Claude Recs | `hooks/useClaudeRecommendations.ts` |
| Types | `types/index.ts`, `types/meeting.ts` |
| App Routes | `App.tsx` |
| Layout/Nav | `components/layout/AppLayout.tsx` |
| Dashboard | `pages/DashboardPage.tsx` |
| Calendar | `pages/CalendarPage.tsx` |
| Personal Todos | `pages/PersonalTodosPage.tsx` |
| Admin | `pages/AdminPanel.tsx` |
| Meeting Room | `components/meeting/MeetingRoom.tsx` |
| Meeting Sections | `components/meeting/sections/*.tsx` |

---

## 6. Implementation Phases

### Phase A — L-10 Feature Parity & Polish (Priority: HIGH)

These items bring the current L-10 to full parity with the original HTML app.

- [x] A1. Toast notification system (global, reusable)
- [x] A2. Eye flash transition between sections
- [x] A3. EOS tips displayed in section headers
- [x] A4. Timer gradient color system (green → gold → amber → red)
- [x] A5. Timer progress bar
- [x] A6. Confetti animation on rock complete + session record
- [x] A7. Scorecard trend arrows
- [x] A8. Scorecard entry notes
- [x] A9. Todo owner filter toggle (My Todos / All)
- [x] A10. Todo completion percentage display
- [x] A11. Segue completion indicator per member
- [x] A12. IDS time-spent tracking per issue
- [x] A13. Conclude: populate attendees from presence data
- [x] A14. Session history page (view past meetings, ratings, stats)
- [x] A15. Session filtering by date
- [x] A16. Session recap export (formatted text/markdown)
- [x] A17. Reset session modal
- [x] A18. Room deletion/archiving
- [x] A19. Responsive mobile layout
- [x] A20. Meeting streak counter on conclude

### Phase B — Prioritization, Categorization & UX (Priority: HIGH)

- [x] B1. Priority selector in PersonalTodosPage add form
- [x] B2. Priority badges across all todo views
- [x] B3. Priority-based sorting option
- [x] B4. Category DB migrations (personal_todos + todos)
- [x] B5. Category selector in add/assign forms
- [x] B6. Category filter chips on todo pages
- [x] B7. Category color coding system
- [x] B8. Overdue + priority auto-escalation logic

### Phase C — Admin & Calendar Enhancements (Priority: HIGH)

- [x] C1. Admin calendar view (all team members' items)
- [x] C2. Admin quick-assign from calendar view
- [x] C3. Calendar items: inline completion toggle
- [x] C4. Calendar day detail panel with status actions
- [x] C5. Dashboard L-10 section (next meeting, quick-enter, streak)
- [x] C6. Upcoming meetings widget on dashboard

### Phase D — Cross-Functional Assignment (Priority: MEDIUM)

- [x] D1. Multi-assignee DB schema (junction tables + RLS)
- [x] D2. Multi-assignee UI in assign forms
- [x] D3. Assignee avatar stack display
- [x] D4. @mention parsing in descriptions
- [x] D5. Cross-department task aggregation on personal dashboard

### Phase E — Claude AI Integration (Priority: MEDIUM)

- [x] E1. Dashboard Claude recommendations widget (top 3)
- [x] E2. "Ask Claude" button on todo/checklist pages
- [x] E3. Context DB category seeding
- [x] E4. Session logging to context DB on meeting record
- [x] E5. Priority pattern analysis Edge Function
- [x] E6. Recommendation reasoning display
- [x] E7. Bi-directional context DB sync workflow

### Phase F — Slack Integration (Priority: MEDIUM)

- [x] F1. L-10 recap to Slack channel
- [x] F2. Todo assignment Slack DM
- [x] F3. Overdue reminder messages
- [x] F4. Meeting start notification
- [x] F5. Daily standup digest

### Phase G — Google Calendar Sync (Priority: LOWER)

- [x] G1. Extended Google OAuth scopes
- [x] G2. Meeting scheduling flow in app
- [x] G3. Google Calendar event creation for room members
- [x] G4. Calendar event update/cancel sync
- [x] G5. ICS fallback for non-Calendar users

### Phase H — Reporting & Analytics (Priority: HIGH)

Data already exists in Context DB and meeting_sessions. This phase surfaces it visually.

- [x] H1. Meeting ratings trend chart (line chart, last 12 meetings)
- [x] H2. Todo completion rate over time (weekly rolling %)
- [x] H3. Rock health dashboard (on-track/off-track/done breakdown per quarter)
- [x] H4. Scorecard metrics trend visualization (sparklines or mini charts per metric)
- [x] H5. Team productivity heatmap (completions by person × week)
- [x] H6. IDS resolution metrics (avg time-to-resolve, issues per meeting trend)
- [x] H7. Exportable PDF/CSV reports for leadership review
- [x] H8. Dashboard analytics summary card (key KPIs at a glance)

### Phase I — V/TO (Vision/Traction Organizer) (Priority: HIGH)

The EOS strategic planning document — a single-page view connecting long-term vision to quarterly execution.

- [x] I1. V/TO data model (core_values, core_focus, ten_year_target, three_year_picture, one_year_plan, quarterly_rocks)
- [x] I2. V/TO page with single-page scrollable layout
- [x] I3. Core Values display with descriptions and behavioral examples
- [x] I4. Core Focus section (purpose/cause/passion + niche)
- [x] I5. 10-Year Target with progress indicator
- [x] I6. 3-Year Picture with revenue, profit, and measurables
- [x] I7. 1-Year Plan with goals connected to quarterly rocks
- [x] I8. V/TO edit mode (owner/admin only) with auto-save
- [x] I9. V/TO sharing — read-only view for team members
- [x] I10. V/TO to Context DB sync (strategic context for Claude recommendations)

### Phase J — Smarter Claude AI (Priority: MEDIUM)

Add an LLM layer on top of the existing algorithmic priority system for deeper pattern recognition and natural language interaction.

- [x] J1. LLM-powered priority analysis Edge Function (upgrade from algorithmic scoring)
- [x] J2. Natural language query interface ("How did Q1 rocks perform?")
- [x] J3. Proactive meeting agenda suggestions based on overdue items and patterns
- [x] J4. Weekly team health summary generated from Context DB patterns
- [x] J5. Smart todo suggestions based on rock progress and historical patterns
- [x] J6. Meeting preparation briefing (pre-meeting context card per attendee)
- [x] J7. Anomaly detection alerts (unusual scorecard dips, completion rate drops)

---

## Progress Tracker

| Phase | Items | Completed | Progress |
|-------|-------|-----------|----------|
| A — L-10 Parity | 20 | 20 | 100% |
| B — Priority/Category | 8 | 8 | 100% |
| C — Admin/Calendar | 6 | 6 | 100% |
| D — Cross-Functional | 5 | 5 | 100% |
| E — Claude AI | 7 | 7 | 100% |
| F — Slack | 5 | 5 | 100% |
| G — Google Calendar | 5 | 5 | 100% |
| H — Reporting & Analytics | 8 | 8 | 100% |
| I — V/TO | 10 | 10 | 100% |
| J — Smarter Claude AI | 7 | 7 | 100% |
| **Total** | **81** | **81** | **100%** |

---

*This document is the single source of truth for CULT-LOS development. Check off items as they're implemented and update the progress tracker.*
