import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: string
  permission_level: 'owner' | 'admin' | 'member'
  is_active: boolean
  is_hidden: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuditEntry {
  id: string
  admin_id: string
  action_type: string
  target_user_id: string | null
  changes: Record<string, unknown> | null
  created_at: string
  admin_profile?: { full_name: string; email: string }
  target_profile?: { full_name: string; email: string }
}

interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role: string
  permission_level: 'admin' | 'member'
}

interface UpdateUserPayload {
  user_id: string
  full_name?: string
  role?: string
  permission_level?: 'admin' | 'member'
  is_active?: boolean
  email?: string
  password?: string
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://blcvkropuiadheukhniu.supabase.co'

async function callAdminFunction(
  method: string,
  token: string,
  body?: Record<string, unknown>
) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export function useAdminUsers() {
  const { session } = useAuth()
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const data = await callAdminFunction('GET', session.access_token)
      setUsers(data.users || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function createUser(payload: CreateUserPayload) {
    if (!session?.access_token) throw new Error('Not authenticated')
    const data = await callAdminFunction('POST', session.access_token, payload)
    await fetchUsers()
    return data
  }

  async function updateUser(payload: UpdateUserPayload) {
    if (!session?.access_token) throw new Error('Not authenticated')
    const data = await callAdminFunction('PUT', session.access_token, payload)
    await fetchUsers()
    return data
  }

  async function deleteUser(userId: string, hard = false) {
    if (!session?.access_token) throw new Error('Not authenticated')
    const data = await callAdminFunction('DELETE', session.access_token, {
      user_id: userId,
      hard,
    })
    await fetchUsers()
    return data
  }

  return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser }
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_profile:profiles!admin_audit_log_admin_id_fkey(full_name, email),
          target_profile:profiles!admin_audit_log_target_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      if (err) throw err
      setEntries((data as unknown as AuditEntry[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return { entries, loading, error, fetchEntries }
}
