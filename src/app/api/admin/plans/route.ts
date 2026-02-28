import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'

type CreatePlanBody = {
  name?: string
  durationDays?: number
  price?: number
  isActive?: boolean
}

export async function GET() {
  try {
    const check = await requireOwnerOrCoach()
    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: Number(plan.price),
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        subscriptionsCount: plan._count.subscriptions,
      })),
    })
  } catch (error) {
    console.error('Fetch plans error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const check = await requireOwnerOrCoach()
    if (!check.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as CreatePlanBody
    const name = body.name?.trim()
    const durationDays = Number(body.durationDays)
    const price = Number(body.price)
    const isActive = body.isActive ?? true

    if (!name) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      return NextResponse.json({ error: 'Duration must be greater than 0' }, { status: 400 })
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        durationDays,
        price,
        isActive,
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Plan created successfully',
        plan: {
          id: plan.id,
          name: plan.name,
          durationDays: plan.durationDays,
          price: Number(plan.price),
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          subscriptionsCount: plan._count.subscriptions,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
