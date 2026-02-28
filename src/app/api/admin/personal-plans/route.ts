import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { MembershipStatus } from '@prisma/client'
import { addDays } from 'date-fns'

type AssignPlanBody = {
  userId?: string
  planId?: string
  activateNow?: boolean
}

export async function GET() {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const memberships = await prisma.membership.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            durationDays: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      memberships: memberships.map((item) => ({
        id: item.id,
        userId: item.userId,
        planId: item.planId,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        membershipFee: Number(item.membershipFee),
        user: item.user,
        plan: {
          ...item.plan,
          price: Number(item.plan.price),
        },
      })),
    })
  } catch (error) {
    console.error('Fetch personal plans error:', error)
    return NextResponse.json({ error: 'Failed to fetch personal plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as AssignPlanBody
    const { userId, planId, activateNow = true } = body

    if (!userId || !planId) {
      return NextResponse.json({ error: 'userId and planId are required' }, { status: 400 })
    }

    const [user, plan, existingMembership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.membership.findUnique({ where: { userId } }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 404 })
    }

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User already has a personal plan. Use update instead.' },
        { status: 409 }
      )
    }

    const startDate = new Date()
    const endDate = addDays(startDate, plan.durationDays)

    const membership = await prisma.membership.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        membershipFee: 500,
        status: activateNow ? MembershipStatus.ACTIVE : MembershipStatus.SUSPENDED,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            durationDays: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: activateNow
          ? 'Personal plan assigned and activated successfully'
          : 'Personal plan assigned as onsite payment pending',
        membership: {
          id: membership.id,
          userId: membership.userId,
          planId: membership.planId,
          startDate: membership.startDate,
          endDate: membership.endDate,
          status: membership.status,
          membershipFee: Number(membership.membershipFee),
          user: membership.user,
          plan: {
            ...membership.plan,
            price: Number(membership.plan.price),
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Assign personal plan error:', error)
    return NextResponse.json({ error: 'Failed to assign personal plan' }, { status: 500 })
  }
}
