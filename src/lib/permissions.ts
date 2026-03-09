// Permission level type and utilities for CULT LOS
export type PermissionLevel = 'owner' | 'admin' | 'member'

export function isOwnerLevel(level: PermissionLevel | undefined | null): boolean {
  return level === 'owner'
}

export function isAdminLevel(level: PermissionLevel | undefined | null): boolean {
  return level === 'admin' || level === 'owner'
}

export function isMemberLevel(level: PermissionLevel | undefined | null): boolean {
  return level === 'member' || level === 'admin' || level === 'owner'
}

/** Returns true if the user can manage other users (create/edit/delete) */
export function canManageUsers(level: PermissionLevel | undefined | null): boolean {
  return isAdminLevel(level)
}

/** Returns true if the user can manage meeting room members */
export function canManageRoomMembers(level: PermissionLevel | undefined | null): boolean {
  return isAdminLevel(level)
}

/** Returns true if the user can view the admin panel */
export function canAccessAdmin(level: PermissionLevel | undefined | null): boolean {
  return isAdminLevel(level)
}

/** Returns true if the user can view all team member todos */
export function canViewAllTodos(level: PermissionLevel | undefined | null): boolean {
  return isAdminLevel(level)
}

/** Returns true if the user can assign todos to other members */
export function canAssignTodos(level: PermissionLevel | undefined | null): boolean {
  return isAdminLevel(level)
}
