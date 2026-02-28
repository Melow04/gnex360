import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { addDays } from 'date-fns'
import { getMembershipStatus } from '@/lib/membership'

export async function GET(request: NextRequest) {
  try {
    const check = await requireOwnerOrCoach()

    if (!check.ok) {
      return NextResponse.json(
        { error: 'Unauthorized', role: check.role || 'none' },
        { status: 403 }
      )
    }

    const userId = request.nextUrl.searchParams.get('userId')

    const memberships = await prisma.membership.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            durationDays: true,
            price: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      memberships: memberships.map((membership) => {
        const validation = getMembershipStatus(membership)

        return {
          id: membership.id,
          userId: membership.userId,
          planId: membership.planId,
          startDate: membership.startDate,
          endDate: membership.endDate,
          status: membership.status,
          membershipFee: Number(membership.membershipFee),
          createdAt: membership.createdAt,
          validation,
          user: membership.user,
          plan: {
            ...membership.plan,
            price: Number(membership.plan.price),
          },
        }
      }),
    })
  } catch (error) {
    console.error('Membership list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only OWNER or COACH can create memberships
    const check = await requireOwnerOrCoach()
    
    if (!check.ok) {
      return NextResponse.json(
        { error: 'Unauthorized', role: check.role || 'none' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, planId } = body

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { membership: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active membership
    if (user.membership) {
      return NextResponse.json(
        { error: 'User already has a membership. Please update or cancel existing membership first.' },
        { status: 409 }
      )
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive plan' },
        { status: 404 }
      )
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = addDays(startDate, plan.durationDays)

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        membershipFee: 500, // Fixed membership fee
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        membership: {
          id: membership.id,
          user: membership.user,
          plan: membership.plan,
          startDate: membership.startDate,
          endDate: membership.endDate,
          membershipFee: membership.membershipFee,
          status: membership.status
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    console.error('Membership creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}
