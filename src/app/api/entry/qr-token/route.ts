import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserRole } from '@/lib/rbac'
import { isMembershipActive } from '@/lib/membership'
import { createEntryQrToken } from '@/lib/qr-token'

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole()
    if (role !== 'client') {
      return NextResponse.json(
        { error: 'Only members can generate entry QR tokens' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 404 })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Member account is not active' },
        { status: 403 }
      )
    }

    if (!user.membership || !isMembershipActive(user.membership)) {
      return NextResponse.json(
        { error: 'Active membership is required to generate QR' },
        { status: 403 }
      )
    }

    const token = createEntryQrToken(user.id)

    return NextResponse.json({
      success: true,
      qrToken: token.token,
      expiresAt: token.expiresAt,
      ttlSeconds: token.ttlSeconds,
      member: {
        name: `${user.firstName} ${user.lastName}`,
        plan: user.membership.plan.name,
      },
    })
  } catch (error) {
    console.error('Generate member QR token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate entry QR token' },
      { status: 500 }
    )
  }
}
