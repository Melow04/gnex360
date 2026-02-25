import { Membership, MembershipStatus } from '@prisma/client'

export function isMembershipActive(membership: Membership): boolean {
  return membership.status === MembershipStatus.ACTIVE && new Date() <= membership.endDate
}

export function getMembershipStatus(membership: Membership): {
  isActive: boolean
  daysRemaining: number
  message: string
} {
  const now = new Date()
  const daysRemaining = Math.ceil((membership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (membership.status === MembershipStatus.SUSPENDED) {
    return {
      isActive: false,
      daysRemaining: 0,
      message: 'Membership suspended'
    }
  }
  
  if (membership.status === MembershipStatus.EXPIRED || daysRemaining < 0) {
    return {
      isActive: false,
      daysRemaining: 0,
      message: 'Membership expired'
    }
  }
  
  return {
    isActive: true,
    daysRemaining,
    message: daysRemaining <= 3 ? 'Expiring soon' : 'Active'
  }
}
