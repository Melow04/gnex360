import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { normalizeUserRole, type UserRole } from './roles'

// Legacy Prisma enum mapping (if needed for DB operations)
export const RoleMapping = {
  owner: 'OWNER',
  dev: 'DEV',
  coach: 'COACH',
  client: 'CLIENT',
} as const

/**
 * Get user role from Clerk public metadata (MVP approach)
 * This is the primary method for RBAC - no DB queries needed!
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth()
  
  const claims = sessionClaims as {
    publicMetadata?: { role?: unknown }
    public_metadata?: { role?: unknown }
    metadata?: { role?: unknown }
  } | null

  const roleFromClaims =
    normalizeUserRole(claims?.publicMetadata?.role) ??
    normalizeUserRole(claims?.public_metadata?.role) ??
    normalizeUserRole(claims?.metadata?.role)

  if (roleFromClaims) {
    return roleFromClaims
  }

  const user = await currentUser()
  return normalizeUserRole(user?.publicMetadata?.role)
}

/**
 * Check if user has one of the allowed roles
 * Use this for server-side protection
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const role = await getUserRole()
  
  if (!role) {
    return { ok: false, role: null, error: 'No role assigned' }
  }
  
  if (!allowedRoles.includes(role)) {
    return { ok: false, role, error: 'Insufficient permissions' }
  }
  
  return { ok: true, role, error: null }
}

/**
 * Shorthand helpers for common role checks
 */
export async function requireOwner() {
  return requireRole(['owner'])
}

export async function requireOwnerOrDev() {
  return requireRole(['owner', 'dev'])
}

export async function requireOwnerOrCoach() {
  return requireRole(['owner', 'coach'])
}

export async function requireStaff() {
  return requireRole(['owner', 'dev', 'coach'])
}

/**
 * Get DB user (optional - use when you need full user data)
 * Most RBAC checks should use getUserRole() instead
 */
export async function getDbUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  return prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      membership: {
        include: {
          plan: true
        }
      }
    }
  })
}
