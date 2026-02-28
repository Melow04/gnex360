import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'

type UpdatePlanBody = {
  name?: string
  durationDays?: number
  price?: number
  isActive?: boolean
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
    const body = (await request.json()) as UpdatePlanBody

    const payload: Record<string, unknown> = {}

    if (typeof body.name !== 'undefined') {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: 'Plan name cannot be empty' }, { status: 400 })
      }
      payload.name = name
    }

    if (typeof body.durationDays !== 'undefined') {
      const durationDays = Number(body.durationDays)
      if (!Number.isFinite(durationDays) || durationDays <= 0) {
        return NextResponse.json({ error: 'Duration must be greater than 0' }, { status: 400 })
      }
      payload.durationDays = durationDays
    }

    if (typeof body.price !== 'undefined') {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
      }
      payload.price = price
    }

    if (typeof body.isActive !== 'undefined') {
      payload.isActive = Boolean(body.isActive)
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: payload,
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: Number(plan.price),
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        subscriptionsCount: plan._count.subscriptions,
      },
    })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
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

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan._count.subscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with existing subscriptions. Set it inactive instead.' },
        { status: 409 }
      )
    }

    await prisma.plan.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
