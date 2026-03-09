import { useMeeting } from '../../hooks/useMeetingRoom'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { PanelLeftClose, PanelLeft, Crown, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'

interface Props {
  open: boolean
  onToggle: () => void
}

export default function MeetingSidebar({ open, onToggle }: Props) {
  const { room, members, presence } = useMeeting()
  const { user } = useAuth()
  const { canManageRoomMembers } = usePermissions()

  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const isOnline = (profileId: string) =>
    presence.some(p => p.user_id === profileId)

  const isMember = useCallback(
    (profileId: string) => members.some(m => m.profile_id === profileId),
    [members]
  )

  // Fetch all non-hidden, non-owner profiles for admin toggle list
  useEffect(() => {
    if (!canManageRoomMembers) return

    async function fetchProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .neq('permission_level', 'owner')
        .eq('is_active', true)
        .order('full_name')

      if (data) setAllProfiles(data as Profile[])
    }

    fetchProfiles()
  }, [canManageRoomMembers])

  // Toggle room membership via Edge Function
  async function toggleMember(profileId: string) {
    if (!room || togglingId) return
    setTogglingId(profileId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const action = isMember(profileId) ? 'remove' : 'add'

      const response = await fetch(
        'https://blcvkropuiadheukhniu.supabase.co/functions/v1/admin-toggle-room-member',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            profile_id: profileId,
            action,
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        console.error('Toggle failed:', err)
      }
      // The realtime subscription in useMeeting will update the members list
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setTogglingId(null)
    }
  }

  // Collapsed sidebar
  if (!open) {
    return (
      <div className="flex-shrink-0 w-12 bg-cult-dark border-r border-cult-border flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="text-cult-text hover:text-cult-white transition-colors mb-6"
        >
          <PanelLeft size={16} />
        </button>
        <div className="space-y-2">
          {presence.map(p => (
            <div
              key={p.user_id}
              className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center"
              title={p.name}
            >
              <span className="text-[9px] font-mono text-cult-gold font-medium">
                {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Expanded sidebar
  return (
    <aside className="flex-shrink-0 w-56 bg-cult-dark border-r border-cult-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-cult-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center">
            <span className="font-display text-cult-gold text-xs">L10</span>
          </div>
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">
            Attendees
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-cult-text hover:text-cult-white transition-colors"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* In Room (presence) */}
        <div className="mb-4">
          <div className="text-[10px] font-mono text-cult-gold/70 tracking-wider uppercase px-2 mb-2">
            In Room ({presence.length})
          </div>
          <div className="space-y-1">
            {presence.map(p => (
              <div
                key={p.user_id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-cult-gold font-medium">
                      {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cult-green-bright border-2 border-cult-dark" />
                </div>
                <span className="text-xs text-cult-white truncate">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members list */}
        <div>
          <div className="text-[10px] font-mono text-cult-text/60 tracking-wider uppercase px-2 mb-2">
            Members ({members.length})
          </div>
          <div className="space-y-1">
            {members.map(m => {
              const name = m.profiles?.full_name || 'Unknown'
              const online = isOnline(m.profile_id)
              return (
                <div
                  key={m.id}
                  className={
                    'flex items-center gap-2.5 px-2 py-1.5 rounded-md ' +
                    (online ? '' : 'opacity-40')
                  }
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-cult-muted border border-cult-border flex items-center justify-center">
                      <span className="text-[9px] font-mono text-cult-text font-medium">
                        {name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-cult-text truncate flex-1">
                    {name}
                  </span>
                  {m.role === 'facilitator' && (
                    <Crown size={10} className="text-cult-gold flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom section: Admin toggle list OR read-only for non-admins */}
      {canManageRoomMembers ? (
        <div className="px-3 py-3 border-t border-cult-border">
          <div className="text-[10px] font-mono text-cult-gold/70 tracking-wider uppercase px-1 mb-2">
            Manage Members
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allProfiles.map(profile => {
              const active = isMember(profile.id)
              const toggling = togglingId === profile.id
              return (
                <button
                  key={profile.id}
                  onClick={() => toggleMember(profile.id)}
                  disabled={toggling}
                  className={
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ' +
                    (active
                      ? 'text-cult-white hover:bg-cult-muted/30'
                      : 'text-cult-text/50 hover:bg-cult-muted/20')
                  }
                >
                  <div className="w-6 h-6 rounded-full bg-cult-muted border border-cult-border flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-mono font-medium">
                      {profile.full_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <span className="truncate flex-1 text-left">
                    {profile.full_name}
                  </span>
                  {toggling ? (
                    <Loader2 size={14} className="animate-spin text-cult-gold flex-shrink-0" />
                  ) : active ? (
                    <ToggleRight size={16} className="text-cult-gold flex-shrink-0" />
                  ) : (
                    <ToggleLeft size={16} className="text-cult-text/30 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 border-t border-cult-border">
          <div className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase px-1 text-center">
            {members.length} member{members.length !== 1 ? 's' : ''} in room
          </div>
        </div>
      )}
    </aside>
  )
}
