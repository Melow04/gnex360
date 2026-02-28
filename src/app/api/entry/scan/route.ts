import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@prisma/client'
import { isMembershipActive } from '@/lib/membership'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { verifyEntryQrToken } from '@/lib/qr-token'

export async function POST(request: NextRequest) {
  try {
    const access = await requireOwnerOrCoach()
    if (!access.ok) {
      return NextResponse.json(
        { error: 'Unauthorized scanner access' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const qrToken = body.qrToken || body.qrCode

    if (!qrToken) {
      return NextResponse.json(
        { error: 'QR token is required' },
        { status: 400 }
      )
    }

    const tokenVerification = verifyEntryQrToken(qrToken)
    if (!tokenVerification.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired QR token',
          reason: tokenVerification.reason,
        },
        { status: 403 }
      )
    }

    // Find user by secure token payload
    const user = await prisma.user.findUnique({
      where: { id: tokenVerification.payload.userId },
      include: {
        membership: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid QR token',
          reason: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied',
          reason: user.status === UserStatus.BANNED ? 'USER_BANNED' : 'USER_INACTIVE',
          userName: `${user.firstName} ${user.lastName}`
        },
        { status: 403 }
      )
    }

    // Check if user has a membership
    if (!user.membership) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active membership',
          reason: 'NO_MEMBERSHIP',
          userName: `${user.firstName} ${user.lastName}`
        },
        { status: 403 }
      )
    }

    // Check if membership is active
    if (!isMembershipActive(user.membership)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Membership expired or suspended',
          reason: 'MEMBERSHIP_EXPIRED',
          userName: `${user.firstName} ${user.lastName}`,
          expiryDate: user.membership.endDate
        },
        { status: 403 }
      )
    }

    // Log the entry
    const entryLog = await prisma.entryLog.create({
      data: {
        userId: user.id,
        method: 'QR'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Entry granted',
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        membershipPlan: user.membership.plan.name,
        expiryDate: user.membership.endDate
      },
      entryTime: entryLog.entryTime
    })
  } catch (error) {
    console.error('Entry scan error:', error)
    return NextResponse.json(
      { error: 'Failed to process entry' },
      { status: 500 }
    )
  }
}
