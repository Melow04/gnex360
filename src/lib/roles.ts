export type UserRole = 'owner' | 'dev' | 'coach' | 'client' | 'visitor'

export function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (normalized === 'admin') return 'owner'
  if (normalized === 'member') return 'client'

  if (
    normalized === 'owner' ||
    normalized === 'dev' ||
    normalized === 'coach' ||
    normalized === 'client' ||
    normalized === 'visitor'
  ) {
    return normalized
  }

  return null
}
