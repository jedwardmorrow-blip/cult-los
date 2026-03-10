import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/Toast'
import { useMeetingSchedules } from '../../hooks/useMeetingSchedules'
import { MeetingRoom, RoomMember } from '../../types/meeting'
import ScheduleMeetingModal from '../../components/meeting/ScheduleMeetingModal'
import { Plus, Users, Clock, ArrowRight, X, Trash2, CalendarPlus, Calendar } from 'lucide-react'

interface RoomWithMembers extends MeetingRoom {
  room_members: { count: number }[]
}

export default function RoomsPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [rooms, setRooms] = useState<RoomWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  // A18: Room deletion state
  const [deleteTarget, setDeleteTarget] = useState<RoomWithMembers | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)
  // G2: Meeting scheduling state
  const { upcoming, scheduleMeeting } = useMeetingSchedules()
  const [scheduleTarget, setScheduleTarget] = useState<RoomWithMembers | null>(null)

  useEffect(() => {
    if (user) loadRooms()
  }, [user])

  async function loadRooms() {
    const { data: memberOf } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('profile_id', user!.id)

    if (!memberOf || memberOf.length === 0) {
      setRooms([])
      setLoading(false)
      return
    }

    const roomIds = memberOf.map(m => m.room_id)
    const { data } = await supabase
      .from('meeting_rooms')
      .select('*, room_members(count)')
      .in('id', roomIds)
      .order('created_at', { ascending: false })

    setRooms((data as RoomWithMembers[]) || [])
    setLoading(false)
  }

  async function createRoom() {
    if (!newName.trim() || !user) return
    setCreating(true)

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)
      .single()

    const { data: room, error } = await supabase
      .from('meeting_rooms')
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        business_id: biz?.id || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (room && !error) {
      await supabase.from('room_members').insert({
        room_id: room.id,
        profile_id: user.id,
        role: 'facilitator',
      })

      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      await loadRooms()
    }
    setCreating(false)
  }

  // A18: Delete room with cascade
  async function deleteRoom() {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return
    setDeleting(true)

    const roomId = deleteTarget.id
    try {
      // Cascade delete all related data
      await supabase.from('meeting_segues').delete().eq('room_id', roomId)
      await supabase.from('meeting_headlines').delete().eq('room_id', roomId)
      await supabase.from('meeting_sessions').delete().eq('room_id', roomId)
      await supabase.from('meeting_timer').delete().eq('room_id', roomId)
      await supabase.from('room_section_config').delete().eq('room_id', roomId)
      await supabase.from('room_invites').delete().eq('room_id', roomId)
      await supabase.from('room_members').delete().eq('room_id', roomId)
      // Finally delete the room itself
      const { error } = await supabase.from('meeting_rooms').delete().eq('id', roomId)
      if (error) throw error

      showToast('Room deleted', 'success')
      setDeleteTarget(null)
      setDeleteConfirmName('')
      await loadRooms()
    } catch (err) {
      showToast('Failed to delete room', 'error')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-xs text-cult-text tracking-[0.4em] animate-pulse">LOADING ROOMS</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">L10 Meeting Rooms</h1>
          <p className="text-cult-text text-sm mt-1">EOS Level 10 meetings — structured, focused, productive.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} />
          <span>New Room</span>
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl tracking-wider text-cult-white">CREATE ROOM</h2>
              <button onClick={() => setShowCreate(false)} className="text-cult-text hover:text-cult-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-cult-text mb-1.5 uppercase tracking-wider">Room Name</label>
                <input className="input-field" placeholder="e.g. Leadership Team L10" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createRoom()} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-mono text-cult-text mb-1.5 uppercase tracking-wider">Description (optional)</label>
                <input className="input-field" placeholder="Weekly leadership sync" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                <button onClick={createRoom} disabled={!newName.trim() || creating} className="btn-primary">{creating ? 'Creating...' : 'Create Room'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cult-gold/10 border border-cult-gold/20 flex items-center justify-center">
            <Users size={24} className="text-cult-gold" />
          </div>
          <h3 className="font-display text-xl tracking-wider text-cult-white mb-2">NO ROOMS YET</h3>
          <p className="text-cult-text text-sm mb-6">Create your first L10 meeting room to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} className="inline mr-1" /> Create First Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map(room => {
            const isCreator = room.created_by === user?.id
            return (
              <div key={room.id} className="card p-5 hover:border-cult-gold/40 transition-all duration-200 group cursor-pointer relative"
                onClick={() => navigate(`/meeting/${room.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg tracking-wider text-cult-white group-hover:text-cult-gold transition-colors truncate">{room.name}</h3>
                    {room.description && <p className="text-cult-text text-xs mt-1 truncate">{room.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    {/* G2: Schedule button */}
                    <button
                      onClick={e => { e.stopPropagation(); setScheduleTarget(room) }}
                      className="p-1.5 rounded text-cult-text/30 hover:text-cult-gold hover:bg-cult-gold/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Schedule meeting"
                    >
                      <CalendarPlus size={14} />
                    </button>
                    {/* A18: Delete button — creator only */}
                    {isCreator && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(room); setDeleteConfirmName('') }}
                        className="p-1.5 rounded text-cult-text/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete room"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ArrowRight size={16} className="text-cult-text group-hover:text-cult-gold transition-colors mt-0.5" />
                  </div>
                </div>
                {/* G2: Upcoming meeting for this room */}
                {(() => {
                  const next = upcoming.find(s => s.room_id === room.id)
                  if (!next) return null
                  const d = new Date(next.scheduled_at)
                  return (
                    <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 rounded bg-cult-gold/5 border border-cult-gold/10 text-[10px] font-mono text-cult-gold/80">
                      <Calendar size={10} />
                      <span>Next: {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  )
                })()}
                <div className="flex items-center gap-4 mt-3 text-xs text-cult-text font-mono">
                  <span className="flex items-center gap-1.5"><Users size={12} />{room.room_members?.[0]?.count || 0} members</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} />{room.timer_duration_minutes}m</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* G2: Schedule meeting modal */}
      {scheduleTarget && (
        <ScheduleMeetingModal
          room={scheduleTarget}
          onSchedule={async (params) => {
            const result = await scheduleMeeting(params)
            if (result) showToast('Meeting scheduled', 'success')
            else showToast('Failed to schedule', 'error')
          }}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {/* A18: Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-cult-dark border border-cult-border rounded-xl p-6 max-w-sm w-full mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg tracking-widest text-cult-white mb-2">Delete Room?</h3>
            <p className="text-sm text-cult-text mb-1">This will permanently delete:</p>
            <ul className="text-xs text-cult-text/60 space-y-1 mb-4 ml-3">
              <li>• The room and all members</li>
              <li>• All meeting sessions & history</li>
              <li>• All segues and headlines</li>
              <li>• Timer state and section configs</li>
            </ul>
            <p className="text-[10px] font-mono text-red-400/70 mb-3">
              This action cannot be undone.
            </p>
            <label className="block text-[10px] font-mono text-cult-text/50 tracking-wider uppercase mb-1.5">
              Type "{deleteTarget.name}" to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              placeholder={deleteTarget.name}
              className="input-field w-full mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && deleteConfirmName === deleteTarget.name && deleteRoom()}
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost text-xs">
                Cancel
              </button>
              <button
                onClick={deleteRoom}
                disabled={deleteConfirmName !== deleteTarget.name || deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
