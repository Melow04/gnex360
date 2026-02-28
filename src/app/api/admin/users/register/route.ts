import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { Role } from '@prisma/client'
import { v4 as uuid } from 'uuid'

type RegisterBody = {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: 'client' | 'coach'
}

function mapRole(role: 'client' | 'coach') {
  return role === 'coach' ? Role.COACH : Role.CLIENT
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireOwnerOrCoach()
    if (!access.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as RegisterBody
    const email = body.email?.trim().toLowerCase()
    const role = body.role

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (role !== 'client' && role !== 'coach') {
      return NextResponse.json(
        { error: 'Role must be client or coach' },
        { status: 400 }
      )
    }

    const clerk = await clerkClient()
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    })

    const clerkUser = clerkUsers.data[0]
    if (!clerkUser) {
      return NextResponse.json(
        {
          error:
            'No Clerk account found for this email. Ask the person to sign up first, then register them here.',
        },
        { status: 404 }
      )
    }

    const resolvedFirstName = body.firstName?.trim() || clerkUser.firstName || 'User'
    const resolvedLastName = body.lastName?.trim() || clerkUser.lastName || ''
    const resolvedPhone = body.phone?.trim() || null
    const resolvedEmail =
      clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress || email

    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...(clerkUser.publicMetadata || {}),
        role,
      },
    })

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        email: resolvedEmail,
        phone: resolvedPhone,
        role: mapRole(role),
      },
      create: {
        clerkId: clerkUser.id,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        email: resolvedEmail,
        phone: resolvedPhone,
        qrCode: `GNEX-${uuid()}`,
        role: mapRole(role),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clerkId: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User registered and role assigned successfully',
      user,
    })
  } catch (error) {
    console.error('Admin register user error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
