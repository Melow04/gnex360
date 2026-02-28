import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { MembershipStatus } from '@prisma/client'
import { addDays } from 'date-fns'

type ActivateBody = {
  note?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as ActivateBody

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Personal plan record not found' }, { status: 404 })
    }

    const now = new Date()
    const nextEndDate = addDays(now, membership.plan.durationDays)

    const updatedMembership = await prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.ACTIVE,
        startDate: now,
        endDate: nextEndDate,
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

    const totalPaid = Number(membership.membershipFee) + Number(membership.plan.price)

    await prisma.payment.create({
      data: {
        membershipId: membership.id,
        amount: totalPaid,
        method: 'CASH',
        note: body.note?.trim() || 'Onsite payment confirmed by admin',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Membership activated from onsite payment',
      membership: {
        id: updatedMembership.id,
        userId: updatedMembership.userId,
        planId: updatedMembership.planId,
        startDate: updatedMembership.startDate,
        endDate: updatedMembership.endDate,
        status: updatedMembership.status,
        membershipFee: Number(updatedMembership.membershipFee),
        user: updatedMembership.user,
        plan: {
          ...updatedMembership.plan,
          price: Number(updatedMembership.plan.price),
        },
      },
    })
  } catch (error) {
    console.error('Activate personal plan onsite error:', error)
    return NextResponse.json({ error: 'Failed to activate personal plan' }, { status: 500 })
  }
}
