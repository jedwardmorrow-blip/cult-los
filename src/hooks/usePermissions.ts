import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  PermissionLevel,
  isOwnerLevel,
  isAdminLevel,
  canManageUsers,
  canManageRoomMembers,
  canAccessAdmin,
  canViewAllTodos,
  canAssignTodos,
} from '../lib/permissions'

interface UsePermissionsReturn {
  permissionLevel: PermissionLevel | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
  canManageUsers: boolean
  canManageRoomMembers: boolean
  canAccessAdmin: boolean
  canViewAllTodos: boolean
  canAssignTodos: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { profile } = useAuth()

  return useMemo(() => {
    const level = (profile?.permission_level as PermissionLevel) ?? null

    return {
      permissionLevel: level,
      isOwner: isOwnerLevel(level),
      isAdmin: isAdminLevel(level),
      isMember: level !== null,
      canManageUsers: canManageUsers(level),
      canManageRoomMembers: canManageRoomMembers(level),
      canAccessAdmin: canAccessAdmin(level),
      canViewAllTodos: canViewAllTodos(level),
      canAssignTodos: canAssignTodos(level),
    }
  }, [profile?.permission_level])
}
