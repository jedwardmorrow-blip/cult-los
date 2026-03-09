import { useState } from 'react'
import { useMeeting } from '../../../hooks/useMeetingRoom'
import { useAuth } from '../../../hooks/useAuth'
import { Smile, Check, Edit3 } from 'lucide-react'

export default function SegueSection() {
  const { user } = useAuth()
  const { members, presence, segues, upsertSegue } = useMeeting()
  const [editing, setEditing] = useState(false)
  const [personal, setPersonal] = useState('')
  const [professional, setProfessional] = useState('')

  // Initialize fields from existing segue when entering edit mode
  function startEditing() {
    const mine = segues.find(s => s.profile_id === user?.id)
    setPersonal(mine?.personal || '')
    setProfessional(mine?.professional || '')
    setEditing(true)
  }

  async function handleSave() {
    await upsertSegue(personal, professional)
    setEditing(false)
  }

  // Get online user IDs for presence indicator
  const onlineIds = new Set(presence.map(p => p.user_id))

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs font-mono text-cult-text/60 tracking-wider uppercase">
          Share one personal and one professional piece of good news
        </p>
      </div>

      {members.map((member) => {
        const isMe = member.profile_id === user?.id
        const segue = segues.find(s => s.profile_id === member.profile_id)
        const online = onlineIds.has(member.profile_id)
        const name = member.profiles?.full_name || 'Unknown'

        return (
          <div
            key={member.id}
            className={`
              rounded-lg border transition-all duration-200
              ${isMe
                ? 'border-cult-gold/30 bg-cult-gold/5'
                : 'border-cult-border bg-cult-surface'
              }
            `}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cult-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt={name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cult-muted flex items-center justify-center text-xs font-medium text-cult-text">
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cult-surface ${online ? 'bg-green-500' : 'bg-cult-muted'}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-cult-white">{name}</span>
                  {isMe && <span className="text-[10px] font-mono text-cult-gold ml-2">(you)</span>}
                </div>
              </div>

              {isMe && !editing && (
                <button onClick={startEditing} className="btn-ghost text-xs flex items-center gap-1.5">
                  <Edit3 size={12} />
                  {segue?.personal ? 'Edit' : 'Add'}
                </button>
              )}
              {isMe && editing && (
                <button onClick={handleSave} className="btn-gold text-xs flex items-center gap-1.5">
                  <Check size={12} />
                  Save
                </button>
              )}
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
              {isMe && editing ? (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-cult-gold/60 tracking-wider uppercase mb-1">
                      Personal Good News
                    </label>
                    <input
                      type="text"
                      value={personal}
                      onChange={e => setPersonal(e.target.value)}
                      placeholder="Share something personal..."
                      className="input-field w-full"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-cult-gold/60 tracking-wider uppercase mb-1">
                      Professional Good News
                    </label>
                    <input
                      type="text"
                      value={professional}
                      onChange={e => setProfessional(e.target.value)}
                      placeholder="Share something professional..."
                      className="input-field w-full"
                    />
                  </div>
                </>
              ) : segue?.personal || segue?.professional ? (
                <>
                  {segue.personal && (
                    <div>
                      <div className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-0.5">Personal</div>
                      <p className="text-sm text-cult-white">{segue.personal}</p>
                    </div>
                  )}
                  {segue.professional && (
                    <div>
                      <div className="text-[10px] font-mono text-cult-text/40 tracking-wider uppercase mb-0.5">Professional</div>
                      <p className="text-sm text-cult-white">{segue.professional}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-cult-text/40 italic flex items-center gap-2">
                  <Smile size={14} className="text-cult-text/30" />
                  {isMe ? 'Click Edit to share your good news' : 'Waiting...'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}