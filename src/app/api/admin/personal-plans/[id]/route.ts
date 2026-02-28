import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { MembershipStatus } from '@prisma/client'
import { addDays } from 'date-fns'

type UpdateBody = {
  planId?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json()) as UpdateBody
    const planId = body.planId

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const [membership, plan] = await Promise.all([
      prisma.membership.findUnique({ where: { id } }),
      prisma.plan.findUnique({ where: { id: planId } }),
    ])

    if (!membership) {
      return NextResponse.json({ error: 'Personal plan record not found' }, { status: 404 })
    }

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 404 })
    }

    const startDate = new Date()
    const endDate = addDays(startDate, plan.durationDays)

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        planId,
        startDate,
        endDate,
        status: MembershipStatus.ACTIVE,
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

    return NextResponse.json({
      success: true,
      message: 'Personal plan updated successfully',
      membership: {
        id: updated.id,
        userId: updated.userId,
        planId: updated.planId,
        startDate: updated.startDate,
        endDate: updated.endDate,
        status: updated.status,
        membershipFee: Number(updated.membershipFee),
        user: updated.user,
        plan: {
          ...updated.plan,
          price: Number(updated.plan.price),
        },
      },
    })
  } catch (error) {
    console.error('Update personal plan error:', error)
    return NextResponse.json({ error: 'Failed to update personal plan' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const membership = await prisma.membership.findUnique({ where: { id } })
    if (!membership) {
      return NextResponse.json({ error: 'Personal plan record not found' }, { status: 404 })
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.SUSPENDED,
        endDate: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Personal plan cancelled successfully',
      membership: {
        id: updated.id,
        status: updated.status,
        endDate: updated.endDate,
      },
    })
  } catch (error) {
    console.error('Cancel personal plan error:', error)
    return NextResponse.json({ error: 'Failed to cancel personal plan' }, { status: 500 })
  }
}
