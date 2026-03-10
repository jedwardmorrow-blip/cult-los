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
- [ ] **Eye flash transition between sections** — Original has a gold eye-flash overlay animation when switching sections. Current: instant switch, no transition.
- [ ] **EOS tips per section** — Original shows a tip string in each section header (e.g., "Share one personal and one professional piece of good news."). Current: `SECTIONS` constant has `tip` field but it's not rendered in section headers.

### 3.2 Timer System

- [x] Start/pause/reset timer
- [x] Preset durations (30/45/60/75/90/120 min)
- [x] Custom duration input
- [x] Realtime sync across all participants (Supabase broadcast)
- [x] Timer expires visual (red + pulse animation)
- [x] Warning state (amber when < 60s)
- [ ] **Timer gradient color system** — Original uses smooth color transitions: green (>50%) → gold (25-50%) → amber (10-25%) → red (<10%) with corresponding progress bar. Current: only 3 states (gold/running, amber/<60s, red/expired). No progress bar.
- [ ] **Timer progress bar** — Original has a colored bar showing time remaining as a percentage. Current: none.
- [ ] **Timer settings modal with schedule** — Original has a modal to set default meeting time AND schedule meetings. Current: has preset buttons and custom input but no scheduling.

### 3.3 Segue Section

- [x] Per-member personal + professional good news cards
- [x] Avatar and online status indicator
- [x] Edit/save functionality with upsert
- [x] All members displayed in grid layout
- [ ] **Segue completion indicator** — Original shows which members have filled in their segue. Current: shows cards but no explicit "filled" vs "empty" visual distinction.

### 3.4 Scorecard Section

- [x] Metrics table with title, goal, owner
- [x] 4-week Monday-based history columns
- [x] Inline value editing
- [x] Green/red goal comparison coloring
- [ ] **Scorecard trend arrows** — Original shows ↑/↓/→ trend indicators based on week-over-week change. Current: only shows values with goal comparison coloring.
- [ ] **Scorecard notes per entry** — The `scorecard_entries` table has a `notes` field, but the UI doesn't expose it.

### 3.5 Rocks Section

- [x] Status cycling: on_track → off_track → complete
- [x] Owner display with avatar
- [x] Due date display
- [x] Description field
- [x] Summary bar (on track / off track / done counts)
- [ ] **Confetti on rock completion** — Original fires confetti animation when a rock is marked complete. Current: status just changes silently.
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
- [ ] **Todo owner filter/view toggle** — Original lets you filter todos by owner (My Todos vs All). Current: shows all todos in a flat list.
- [ ] **Todo completion percentage** — Original shows X/Y completed. Current: no aggregate stat shown.

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
- [ ] **IDS time-spent tracking** — Original tracks how long each issue is discussed. Current: no per-issue timing.

### 3.9 Conclude Section

- [x] Stats summary (todos, rocks, issues)
- [x] Open todos list
- [x] Cascading messages textarea
- [x] 1-10 meeting rating (star buttons)
- [x] Copy recap to clipboard
- [x] Record session (saves to `meeting_sessions`)
- [ ] **Confetti on session record** — Original fires confetti animation when meeting is recorded. Current: silent success.
- [ ] **Slack recap posting** — Original posts recap to Slack channel. Current: copy to clipboard only.
- [ ] **Meeting streak counter** — Original tracks consecutive meetings held and shows a streak badge. Current: none.
- [ ] **Attendee recording** — The `meeting_sessions.attendees` field exists but conclude section doesn't populate it from presence data.

### 3.10 Session History & Export

- [ ] **Session history page** — Original has `showHistory()` that displays past meetings with stats, ratings, and dates. Current: `meeting_sessions` table exists but no UI to view past sessions.
- [ ] **Session filtering/search** — Original lets you filter sessions by date. Current: no session history UI at all.
- [ ] **Session transcript/recap export** — Original has `exportMeetingRecap()` that generates a formatted text export. Current: conclude section has copy-to-clipboard for current meeting only.

### 3.11 Admin & Settings

- [x] Admin panel with Team Overview, Users, Audit Log
- [x] Room member add/remove (Edge Function)
- [x] Permission-gated admin access
- [x] Profile management
- [ ] **Reset session modal** — Original has `showResetSessionModal()` to clear all in-progress meeting data. Current: no equivalent.
- [ ] **Room deletion** — Current: rooms can be created but not deleted/archived.

### 3.12 Polish & UX

- [ ] **Toast notification system** — Original has a `showToast()` system for user feedback. Current: no toast/notification system (actions complete silently).
- [ ] **Loading states per section** — Original shows section-specific loading. Current: initial loading only.
- [ ] **Empty state illustrations** — Original has custom empty states per section. Current: basic "no data" text.
- [ ] **Responsive mobile layout** — Original has mobile-optimized views. Current: desktop-focused.

---

## 4. New Feature Requests

### 4.1 Admin Team Visibility

**Requirement:** Admin/owner sees team calendars, todos, and checklists for all users. Can add todos and checklist items for other users.

- [x] Admin can view all personal todos (Team View toggle on PersonalTodosPage)
- [x] Admin can assign todos to others (AssignTodoModal with priority, recurring, due date)
- [ ] **Admin calendar view showing all team members' items** — CalendarPage currently shows only the logged-in user's items. Need a team calendar overlay or toggle for admin users showing all team members' tasks color-coded by person.
- [ ] **Admin quick-assign from calendar view** — Allow admin to click a calendar date and assign a new todo/checklist item to any team member from the calendar interface.

### 4.2 Calendar Checklist Integration

**Requirement:** Users can mark checklist items complete directly from calendar view.

- [ ] **Clickable todo/checklist items on calendar** — CalendarPage shows items as colored dots with a detail panel, but items can't be marked complete from the calendar. Need inline status toggle (checkbox) on calendar items.
- [ ] **Calendar day detail panel with completion** — The existing detail panel should include toggle buttons for marking items complete/incomplete without navigating away.

### 4.3 Prioritization System

**Requirement:** Clear system for how todos and checklist items get prioritized.

- [x] `priority` field exists on `todos`, `personal_todos`, `issues` tables
- [x] `usePersonalTodos` hook `addTodo` accepts priority parameter
- [x] AssignTodoModal exposes priority selector (low/medium/high/critical)
- [ ] **Priority in PersonalTodosPage add form** — The hook supports priority but the personal todos add form doesn't expose it. Need priority selector in the quick-add flow.
- [ ] **Priority badges in todo lists** — Show priority badges consistently across all todo views (personal todos, meeting todos, calendar items).
- [ ] **Priority-based sorting** — Allow sorting todos by priority (critical first) in addition to date/status sorting.
- [ ] **Overdue + priority escalation** — Automatic priority bump when items become overdue.

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

- [ ] **Add `category` column to `personal_todos` table** — Migration needed. The hook's `addTodo` already accepts `category` but the column may not exist in the DB schema.
- [ ] **Add `category` column to `todos` table** — Same migration for meeting todos.
- [ ] **Category selector in add/assign forms** — Dropdown in PersonalTodosPage add form and AssignTodoModal.
- [ ] **Category filter chips** — Filter bar on todo pages to show/hide by category.
- [ ] **Category color coding** — Consistent color per category across all views.
- [ ] **Seed categories into Claude Context DB** — Store category definitions in context DB so Claude recommendations can reference them.

### 4.5 Claude AI Priority Recommendations

**Requirement:** Users can check what should be done first based on Claude Context DB interactions.

- [x] `claude_recommendations` table exists with target_type, priority_level, category, reasoning
- [x] `useClaudeRecommendations` hook with fetch/dismiss/markActedOn
- [x] ClaudeRecommendations component with priority config and category icons
- [ ] **Dashboard placement** — Show top 3 Claude recommendations on the dashboard page with expand/dismiss actions.
- [ ] **Context DB bridge refinement** — The `context-db-bridge` Edge Function needs updating to generate recommendations based on overdue items, priority conflicts, and workload balance.
- [ ] **"Ask Claude" button** — Add a button on todo/checklist pages that triggers a recommendation refresh from the Edge Function.
- [ ] **Recommendation reasoning display** — Show Claude's reasoning for each priority suggestion (field exists but may not be populated).

### 4.6 Slack Integration

**Requirement:** Potential Slack integrations for LOS.

The Slack bot infrastructure already exists (Vercel serverless + Claude API + Supabase context loader). Slack IDs are stored on profiles.

- [ ] **L-10 meeting recap to Slack** — Post formatted recap to a designated channel when a meeting session is recorded.
- [ ] **Todo assignment notifications** — Slack DM when a todo is assigned to a user.
- [ ] **Overdue reminders** — Scheduled Slack messages for overdue todos/rocks.
- [ ] **Meeting start notification** — Notify room members when a meeting begins.
- [ ] **Daily standup digest** — Morning Slack message with today's priorities pulled from LOS.

### 4.7 Cross-Functional Task Assignment

**Requirement:** Assign tasks/todos to multiple users. @mention support. Shows on every assigned user's profile.

- [x] **Multi-assignee support** — Junction tables `todo_assignees` and `personal_todo_assignees` with RLS. Co-assignee picker in AssignTodoModal.
- [x] **@mention in task descriptions** — `MentionText` component parses `@name` mentions and renders as styled gold spans.
- [x] **Cross-department task view** — `useAssignedToMeTodos` hook + "Assigned to Me" section on personal dashboard shows tasks from other owners.
- [x] **Assignee avatars** — `AvatarStack` component shows overlapping avatars with initials fallback and overflow indicator.

### 4.8 L-10 Home Screen Placement

**Requirement:** L-10s live in a distinct/separate area on the Home Screen.

- [ ] **Dashboard L-10 section** — Add a dedicated "L-10 Meetings" card/section on the DashboardPage showing: next scheduled meeting, meeting room quick-links, last meeting stats (rating, date), meeting streak.
- [ ] **Quick-enter meeting button** — One-click to enter your primary meeting room from dashboard.
- [ ] **Upcoming meetings widget** — Show next 3 scheduled meetings with countdown timers.

### 4.9 Google Calendar Sync

**Requirement:** L-10 meetings scheduled in app show on each assigned user's Google Calendar.

- [ ] **Google Calendar OAuth scope** — Extend current Google Auth to request `calendar.events` scope.
- [ ] **Meeting scheduling flow** — Add ability to schedule L-10 meetings with date/time in the rooms page or a dedicated scheduling modal.
- [ ] **Calendar event creation** — When a meeting is scheduled, create a Google Calendar event for all room members via the Calendar API.
- [ ] **Calendar event updates** — Sync changes (reschedule, cancel) back to Google Calendar.
- [ ] **ICS fallback** — For users who decline calendar scope, generate downloadable .ics file.

### 4.10 Claude ↔ App ↔ Context DB Workflow

**Requirement:** Clean, intelligent, consistent workflow between app priority setting, Claude, and Claude Context DB.

- [ ] **Session logging on meeting record** — When a meeting session is recorded, log key data (rating, stats, attendees, cascading messages) to the context DB `session_log` table.
- [ ] **Todo completion tracking** — Log significant todo completions to context DB for Claude to learn patterns.
- [ ] **Priority pattern analysis** — Edge Function that analyzes completion patterns and generates recommendations: "You complete cultivation tasks fastest on Tuesdays" or "High-priority items from Sam are often overdue."
- [ ] **Context DB category seeding** — Populate `business_context` table with LOS-specific categories, role definitions, and workflow patterns.
- [ ] **Bi-directional sync** — App reads recommendations from context DB; Claude writes recommendations based on user interactions through Slack bot.

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
| **Total** | **56** | **56** | **100%** |

---

*This document is the single source of truth for CULT-LOS development. Check off items as they're implemented and update the progress tracker.*
