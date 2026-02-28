import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Only OWNER or COACH can view dashboard
    const check = await requireOwnerOrCoach()
    
    if (!check.ok) {
      return NextResponse.json(
        { error: 'Unauthorized', role: check.role || 'none' },
        { status: 403 }
      )
    }

    const today = startOfDay(new Date())

    // Run all queries in parallel
    const [
      totalActiveMembers,
      todayEntries,
      activeSubscriptions,
      recentPayments,
      totalRevenue
    ] = await Promise.all([
      // Total active client users
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          role: 'CLIENT'
        }
      }),
      
      // Today's entry count
      prisma.entryLog.count({
        where: {
          entryTime: {
            gte: today
          }
        }
      }),
      
      // Active subscriptions (not expired)
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date()
          }
        }
      }),
      
      // Recent payments (last 10)
      prisma.payment.findMany({
        orderBy: {
          paidAt: 'desc'
        },
        take: 10,
        include: {
          membership: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              plan: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      // Total revenue from all payments
      prisma.payment.aggregate({
        _sum: {
          amount: true
        }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalActiveMembers,
        todayEntries,
        activeSubscriptions,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paidAt: payment.paidAt,
        method: payment.method,
        note: payment.note,
        user: {
          name: `${payment.membership.user.firstName} ${payment.membership.user.lastName}`,
          email: payment.membership.user.email
        },
        plan: payment.membership.plan.name
      }))
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
