import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { MeetingRoom, RoomMember } from '../../types/meeting'
import { Plus, Users, Clock, ArrowRight, X } from 'lucide-react'

interface RoomWithMembers extends MeetingRoom {
  room_members: { count: number }[]
}

export default function RoomsPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

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
          {rooms.map(room => (
            <button key={room.id} onClick={() => navigate(`/meeting/${room.id}`)} className="card p-5 text-left hover:border-cult-gold/40 transition-all duration-200 group cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg tracking-wider text-cult-white group-hover:text-cult-gold transition-colors truncate">{room.name}</h3>
                  {room.description && <p className="text-cult-text text-xs mt-1 truncate">{room.description}</p>}
                </div>
                <ArrowRight size={16} className="text-cult-text group-hover:text-cult-gold transition-colors flex-shrink-0 ml-3 mt-1" />
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-cult-text font-mono">
                <span className="flex items-center gap-1.5"><Users size={12} />{room.room_members?.[0]?.count || 0} members</span>
                <span className="flex items-center gap-1.5"><Clock size={12} />{room.timer_duration_minutes}m</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
