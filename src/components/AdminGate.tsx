import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

interface AdminGateProps {
  children: ReactNode
  /** If true, redirects non-admin users to dashboard. If false, renders nothing. */
  redirect?: boolean
  /** Custom fallback component to render for non-admin users */
  fallback?: ReactNode
}

/**
 * Wraps content that should only be visible to admin/owner users.
 *
 * Usage:
 *   <AdminGate>
 *     <AdminPanel />
 *   </AdminGate>
 *
 *   <AdminGate redirect>
 *     <AdminPanel />
 *   </AdminGate>
 *
 *   <AdminGate fallback={<p>Access denied</p>}>
 *     <SensitiveContent />
 *   </AdminGate>
 */
export default function AdminGate({ children, redirect = false, fallback = null }: AdminGateProps) {
  const { canAccessAdmin } = usePermissions()

  if (!canAccessAdmin) {
    if (redirect) return <Navigate to="/dashboard" replace />
    return <>{fallback}</>
  }

  return <>{children}</>
}
