import { Clock, UserPlus, UserMinus, Edit2, Shield, ToggleLeft } from 'lucide-react'
import { AuditEntry } from '../../hooks/useAdminUsers'

interface AuditLogProps {
  entries: AuditEntry[]
  loading: boolean
}

const actionMeta: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  create_user: { icon: UserPlus, label: 'Created user', color: 'text-green-400' },
  update_user: { icon: Edit2, label: 'Updated user', color: 'text-blue-400' },
  deactivate_user: { icon: UserMinus, label: 'Deactivated user', color: 'text-red-400' },
  reactivate_user: { icon: ToggleLeft, label: 'Reactivated user', color: 'text-green-400' },
  delete_user: { icon: UserMinus, label: 'Deleted user', color: 'text-red-500' },
  change_permission: { icon: Shield, label: 'Changed permission', color: 'text-cult-gold' },
  toggle_room_member: { icon: ToggleLeft, label: 'Toggled room member', color: 'text-blue-400' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ChangeSummary({ changes }: { changes: Record<string, unknown> | null }) {
  if (!changes || Object.keys(changes).length === 0) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {Object.entries(changes).map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-cult-dark border border-cult-border rounded"
        >
          <span className="text-cult-text">{key.replace(/_/g, ' ')}:</span>
          <span className="text-cult-white ml-1">{String(val)}</span>
        </span>
      ))}
    </div>
  )
}

export default function AuditLog({ entries, loading }: AuditLogProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="font-mono text-xs text-cult-text tracking-[0.3em] animate-pulse">LOADING AUDIT LOG...</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="font-mono text-xs text-cult-text">No audit entries yet.</div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const meta = actionMeta[entry.action_type] || {
          icon: Clock,
          label: entry.action_type.replace(/_/g, ' '),
          color: 'text-cult-text',
        }
        const Icon = meta.icon
        const adminName =
          (entry.admin_profile as { full_name?: string })?.full_name || 'System'
        const targetName =
          (entry.target_profile as { full_name?: string })?.full_name || null

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 px-4 py-3 rounded-md hover:bg-cult-dark/50 transition-colors group"
          >
            <div className={`mt-0.5 p-1.5 rounded ${meta.color} bg-cult-dark border border-cult-border`}>
              <Icon size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-cult-white font-medium">{adminName}</span>
                <span className="text-xs text-cult-text font-mono">{meta.label}</span>
                {targetName && (
                  <>
                    <span className="text-xs text-cult-text">→</span>
                    <span className="text-sm text-cult-white">{targetName}</span>
                  </>
                )}
              </div>
              <ChangeSummary changes={entry.changes} />
            </div>
            <span className="text-[10px] font-mono text-cult-text whitespace-nowrap mt-0.5">
              {formatTime(entry.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
