import { useState, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { AdminProfile } from '../../hooks/useAdminUsers'

interface UserFormProps {
  user: AdminProfile | null // null = create mode
  onSave: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

export default function UserForm({ user, onClose, onSave }: UserFormProps) {
  const isEdit = !!user

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<'admin' | 'member'>('member')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setEmail(user.email || '')
      setRole(user.role || '')
      setPermissionLevel(user.permission_level === 'owner' ? 'admin' : user.permission_level)
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          user_id: user!.id,
          full_name: fullName,
          role,
          permission_level: permissionLevel,
        }
        if (email !== user!.email) payload.email = email
        if (password) payload.password = password
        await onSave(payload)
      } else {
        if (!password) {
          setError('Password is required for new users')
          setSaving(false)
          return
        }
        await onSave({
          email,
          password,
          full_name: fullName,
          role,
          permission_level: permissionLevel,
        })
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-cult-black border border-cult-border rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cult-border">
          <h2 className="font-display text-lg text-cult-white tracking-wide">
            {isEdit ? 'EDIT USER' : 'CREATE USER'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-cult-border transition-colors text-cult-text hover:text-cult-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 text-xs font-mono text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cult-text mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white placeholder:text-cult-text focus:outline-none focus:border-cult-gold/50 font-mono"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cult-text mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white placeholder:text-cult-text focus:outline-none focus:border-cult-gold/50 font-mono"
              placeholder="user@cultcannabis.co"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cult-text mb-1.5">
              {isEdit ? 'New Password (leave blank to keep)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEdit}
                minLength={8}
                className="w-full px-3 py-2 pr-10 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white placeholder:text-cult-text focus:outline-none focus:border-cult-gold/50 font-mono"
                placeholder={isEdit ? '••••••••' : 'Min 8 characters'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cult-text hover:text-cult-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cult-text mb-1.5">
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white placeholder:text-cult-text focus:outline-none focus:border-cult-gold/50 font-mono"
              placeholder="e.g. Director of Operations"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cult-text mb-1.5">
              Permission Level
            </label>
            <select
              value={permissionLevel}
              onChange={(e) => setPermissionLevel(e.target.value as 'admin' | 'member')}
              className="w-full px-3 py-2 bg-cult-dark border border-cult-border rounded-md text-sm text-cult-white font-mono focus:outline-none focus:border-cult-gold/50"
            >
              <option value="member">Member — Standard access</option>
              <option value="admin">Admin — Full management access</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-mono text-cult-text hover:text-cult-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-cult-gold text-cult-black text-sm font-semibold rounded-md hover:bg-cult-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
