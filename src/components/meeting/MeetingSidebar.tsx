import { useMeeting } from '../../hooks/useMeetingRoom'
import { useAuth } from '../../hooks/useAuth'
import { PanelLeftClose, PanelLeft, UserPlus, Crown } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  open: boolean
  onToggle: () => void
}

export default function MeetingSidebar({ open, onToggle }: Props) {
  const { room, members, presence } = useMeeting()
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const isOnline = (profileId: string) =>
    presence.some(p => p.user_id === profileId)

  async function inviteMember() {
    if (!inviteEmail.trim() || !room) return

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim().toLowerCase())
      .single()

    if (existingProfile) {
      await supabase.from('room_members').upsert({
        room_id: room.id,
        profile_id: existingProfile.id,
        role: 'member',
      }, { onConflict: 'room_id,profile_id' })
    } else {
      await supabase.from('room_invites').upsert({
        room_id: room.id,
        email: inviteEmail.trim().toLowerCase(),
        invited_by: user?.id,
      }, { onConflict: 'room_id,email' })
    }

    setInviteEmail('')
    setShowInvite(false)
  }

  if (!open) {
    return (
      <div className="flex-shrink-0 w-12 bg-cult-dark border-r border-cult-border flex flex-col items-center py-4">
        <button onClick={onToggle} className="text-cult-text hover:text-cult-white transition-colors mb-6">
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

  return (
    <aside className="flex-shrink-0 w-56 bg-cult-dark border-r border-cult-border flex flex-col">
      <div className="px-4 py-4 border-b border-cult-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center">
            <span className="font-display text-cult-gold text-xs">L10</span>
          </div>
          <span className="font-mono text-xs text-cult-text tracking-wider uppercase">Attendees</span>
        </div>
        <button onClick={onToggle} className="text-cult-text hover:text-cult-white transition-colors">
          <PanelLeftClose size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <div className="text-[10px] font-mono text-cult-gold/70 tracking-wider uppercase px-2 mb-2">
            In Room ({presence.length})
          </div>
          <div className="space-y-1">
            {presence.map(p => (
              <div key={p.user_id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-cult-gold font-medium">
                      {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cult-green-bright border-2 border-cult-dark" />
                </div>
                <span className="text-xs text-cult-white truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-cult-text/60 tracking-wider uppercase px-2 mb-2">
            Members ({members.length})
          </div>
          <div className="space-y-1">
            {members.map(m => {
              const name = m.profiles?.full_name || 'Unknown'
              const online = isOnline(m.profile_id)
              return (
                <div key={m.id} className={'flex items-center gap-2.5 px-2 py-1.5 rounded-md ' + (online ? '' : 'opacity-40')}>
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-cult-muted border border-cult-border flex items-center justify-center">
                      <span className="text-[9px] font-mono text-cult-text font-medium">
                        {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-cult-text truncate flex-1">{name}</span>
                  {m.role === 'facilitator' && <Crown size={10} className="text-cult-gold flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-t border-cult-border">
        {showInvite ? (
          <div className="space-y-2">
            <input
              className="input-field text-xs"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && inviteMember()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowInvite(false)} className="btn-ghost text-xs flex-1 py-1.5">Cancel</button>
              <button onClick={inviteMember} className="btn-primary text-xs flex-1 py-1.5">Invite</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-cult-border text-cult-text text-xs hover:border-cult-gold/40 hover:text-cult-gold transition-colors"
          >
            <UserPlus size={12} />
            <span>Invite Member</span>
          </button>
        )}
      </div>
    </aside>
  )
}
