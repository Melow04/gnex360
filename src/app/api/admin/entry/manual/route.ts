import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { Role, UserStatus } from '@prisma/client'
import { isMembershipActive } from '@/lib/membership'
import { v4 as uuid } from 'uuid'

type ManualEntryBody = {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  isWalkIn?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as ManualEntryBody
    const email = body.email?.trim().toLowerCase()
    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim()
    const phone = body.phone?.trim() || null
    const isWalkIn = Boolean(body.isWalkIn)

    if (!isWalkIn && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (isWalkIn) {
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'First name and last name are required for walk-in entry' },
          { status: 400 }
        )
      }

      let walkInUser = email
        ? await prisma.user.findUnique({
            where: { email },
          })
        : null

      if (!walkInUser) {
        const generatedEmail = email || `walkin-${Date.now()}-${Math.floor(Math.random() * 1000)}@walkin.local`
        walkInUser = await prisma.user.create({
          data: {
            clerkId: `walkin-${uuid()}`,
            role: Role.CLIENT,
            firstName,
            lastName,
            email: generatedEmail,
            phone,
            qrCode: `GNEX-${uuid()}`,
            status: UserStatus.ACTIVE,
          },
        })
      }

      if (walkInUser.status !== UserStatus.ACTIVE) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            reason: walkInUser.status === UserStatus.BANNED ? 'USER_BANNED' : 'USER_INACTIVE',
            userName: `${walkInUser.firstName} ${walkInUser.lastName}`,
        },
          { status: 403 }
        )
      }

      const entryLog = await prisma.entryLog.create({
        data: {
          userId: walkInUser.id,
          method: 'WALK_IN',
        },
      })

      return NextResponse.json({
        success: true,
        walkIn: true,
        message: 'Walk-in entry logged',
        user: {
          id: walkInUser.id,
          name: `${walkInUser.firstName} ${walkInUser.lastName}`,
          email: walkInUser.email,
        },
        entryTime: entryLog.entryTime,
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email! },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
    })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', reason: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          reason: user.status === UserStatus.BANNED ? 'USER_BANNED' : 'USER_INACTIVE',
          userName: `${user.firstName} ${user.lastName}`,
        },
        { status: 403 }
      )
    }

    if (!user.membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active membership',
          reason: 'NO_MEMBERSHIP',
          userName: `${user.firstName} ${user.lastName}`,
        },
        { status: 403 }
      )
    }

    if (!isMembershipActive(user.membership)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Membership expired or suspended',
          reason: 'MEMBERSHIP_EXPIRED',
          userName: `${user.firstName} ${user.lastName}`,
          expiryDate: user.membership.endDate,
        },
        { status: 403 }
      )
    }

    const entryLog = await prisma.entryLog.create({
      data: {
        userId: user.id,
        method: 'MANUAL',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Manual entry logged',
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        membershipPlan: user.membership.plan.name,
      },
      entryTime: entryLog.entryTime,
    })
  } catch (error) {
    console.error('Manual entry error:', error)
    return NextResponse.json({ error: 'Failed to log manual entry' }, { status: 500 })
  }
}
