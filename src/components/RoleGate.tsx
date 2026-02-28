'use client'

import { useUser } from '@clerk/nextjs'
import { normalizeUserRole, type UserRole } from '@/lib/roles'

interface RoleGateProps {
  allow: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Client-side role gating for UI elements
 * ⚠️ NOT FOR SECURITY - Always protect server pages + API routes!
 * 
 * Usage:
 * <RoleGate allow={['owner', 'dev']}>
 *   <button>Admin Settings</button>
 * </RoleGate>
 */
export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { user, isLoaded } = useUser()
  
  // Don't show anything while loading
  if (!isLoaded) return null
  
  // No user = no access
  if (!user) return <>{fallback}</>
  
  const role = normalizeUserRole(user.publicMetadata?.role)
  
  // No role or not in allowed list = no access
  if (!role || !allow.includes(role)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Inverse role gate - show content when user does NOT have certain roles
 */
export function RoleGateInverse({ allow, children, fallback = null }: RoleGateProps) {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return null
  if (!user) return <>{children}</>
  
  const role = normalizeUserRole(user.publicMetadata?.role)
  
  if (!role || !allow.includes(role)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}
