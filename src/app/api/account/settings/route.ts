import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getUserRole } from '@/lib/rbac'

function mapMetadataRoleToDbRole(role: string | null): Role {
  if (role === 'owner') return Role.OWNER
  if (role === 'dev') return Role.DEV
  if (role === 'coach') return Role.COACH
  return Role.CLIENT
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return null

  return (
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress || user.emailAddresses[0]?.emailAddress || null
  )
}

async function getOrCreateUser() {
  const { userId } = await auth()

  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  const email = getPrimaryEmail(clerkUser)
  if (!email) {
    return { error: NextResponse.json({ error: 'No email found for account' }, { status: 400 }) }
  }

  const role = await getUserRole()

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      firstName: clerkUser.firstName?.trim() || 'User',
      lastName: clerkUser.lastName?.trim() || '',
    },
    create: {
      clerkId: userId,
      email,
      firstName: clerkUser.firstName?.trim() || 'User',
      lastName: clerkUser.lastName?.trim() || '',
      phone: null,
      qrCode: `GNEX-${uuid()}`,
      role: mapMetadataRoleToDbRole(role),
    },
  })

  return { user, userId }
}

export async function GET() {
  try {
    const result = await getOrCreateUser()
    if ('error' in result) return result.error

    return NextResponse.json({
      profile: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role.toLowerCase(),
        status: result.user.status.toLowerCase(),
        createdAt: result.user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get account settings error:', error)
    return NextResponse.json({ error: 'Failed to load account settings' }, { status: 500 })
  }
}

type UpdateSettingsBody = {
  firstName?: string
  lastName?: string
  phone?: string
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await getOrCreateUser()
    if ('error' in result) return result.error

    const body = (await request.json()) as UpdateSettingsBody

    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim() || ''
    const phone = body.phone?.trim() || null

    if (!firstName) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { clerkId: result.userId },
      data: {
        firstName,
        lastName,
        phone,
      },
    })

    try {
      const clerk = await clerkClient()
      await clerk.users.updateUser(result.userId, {
        firstName,
        lastName,
      })
    } catch (clerkError) {
      console.error('Clerk profile sync error:', clerkError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account settings updated successfully',
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        status: user.status.toLowerCase(),
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Update account settings error:', error)
    return NextResponse.json({ error: 'Failed to update account settings' }, { status: 500 })
  }
}
