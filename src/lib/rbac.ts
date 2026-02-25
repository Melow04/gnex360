import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

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

export async function requireRole(roles: Role[]) {
  const user = await getDbUser()
  if (!user || !roles.includes(user.role)) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireOwner() {
  return requireRole([Role.OWNER])
}

export async function requireOwnerOrCoach() {
  return requireRole([Role.OWNER, Role.COACH])
}
