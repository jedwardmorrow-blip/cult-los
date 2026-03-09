import { useState } from 'react'
import { Search, Plus, Edit2, UserX, UserCheck, Shield, ShieldAlert, User } from 'lucide-react'
import { AdminProfile } from '../../hooks/useAdminUsers'

interface UserListProps {
  users: AdminProfile[]
  loading: boolean
  onEdit: (user: AdminProfile) => void
  onCreate: () => void
  onToggleActive: (user: AdminProfile) => void
}

function PermissionBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    owner: 'bg-cult-gold/20 text-cult-gold border-cult-gold/30',
    admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    member: 'bg-cult-border text-cult-text border-cult-border',
  }
  const icons: Record<string, typeof Shield> = {
    owner: ShieldAlert,
    admin: Shield,
    member: User,
  }
  const Icon = icons[level] || User
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm ${styles[level] || styles.member}`}>
      <Icon size={10} />
      {level}
    </span>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
  )
}

export default function UserList({ users, loading, onEdit, onCreate, onToggleActive }: UserListProps) {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = filterLevel === 'all' || u.permission_level === filterLevel
    return matchesSearch && matchesLevel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="font-mono text-xs text-cult-text tracking-[0.3em] animate-pulse">LOADING USERS...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cult-text" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white placeholder:text-cult-text focus:outline-none focus:border-cult-gold/50 font-mono"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white font-mono focus:outline-none focus:border-cult-gold/50"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-cult-gold text-cult-black text-sm font-semibold rounded-md hover:bg-cult-gold/90 transition-colors"
        >
          <Plus size={14} />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="border border-cult-border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-cult-dark border-b border-cult-border">
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-cult-text">User</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-cult-text">Role</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-cult-text">Permission</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-cult-text">Status</th>
              <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-cult-text">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cult-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-cult-text font-mono">
                  {search ? 'No users match your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-cult-dark/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-xs text-cult-gold font-medium">
                          {user.full_name
                            ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
                            : '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-cult-white">{user.full_name}</div>
                        <div className="text-[11px] text-cult-text font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-cult-text capitalize">{user.role?.replace(/_/g, ' ') || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PermissionBadge level={user.permission_level} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot active={user.is_active} />
                      <span className="text-xs font-mono text-cult-text">{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.permission_level !== 'owner' && (
                        <>
                          <button
                            onClick={() => onEdit(user)}
                            className="p-1.5 rounded hover:bg-cult-border transition-colors text-cult-text hover:text-cult-white"
                            title="Edit user"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onToggleActive(user)}
                            className={`p-1.5 rounded hover:bg-cult-border transition-colors ${
                              user.is_active ? 'text-cult-text hover:text-red-400' : 'text-cult-text hover:text-green-400'
                            }`}
                            title={user.is_active ? 'Deactivate user' : 'Reactivate user'}
                          >
                            {user.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] font-mono text-cult-text text-right">
        {filtered.length} of {users.length} users shown
      </div>
    </div>
  )
}
