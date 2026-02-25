import { requireOwnerOrCoach } from '@/lib/rbac'
import { DashboardClient } from '@/components/DashboardClient'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export default async function DashboardPage() {
  // Protect the page
  await requireOwnerOrCoach()

  const today = startOfDay(new Date())

  // Fetch dashboard data
  const [
    totalActiveMembers,
    todayEntries,
    activeSubscriptions,
    recentPayments,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count({
      where: {
        status: 'ACTIVE',
        role: 'CLIENT'
      }
    }),
    
    prisma.entryLog.count({
      where: {
        entryTime: {
          gte: today
        }
      }
    }),
    
    prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      }
    }),
    
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

    prisma.payment.aggregate({
      _sum: {
        amount: true
      }
    })
  ])

  const stats = {
    totalActiveMembers,
    todayEntries,
    activeSubscriptions,
    totalRevenue: Number(totalRevenue._sum.amount || 0)
  }

  const formattedPayments = recentPayments.map(payment => ({
    id: payment.id,
    amount: Number(payment.amount),
    paidAt: payment.paidAt.toISOString(),
    method: payment.method,
    note: payment.note,
    user: {
      name: `${payment.membership.user.firstName} ${payment.membership.user.lastName}`,
      email: payment.membership.user.email
    },
    plan: payment.membership.plan.name
  }))

  return <DashboardClient stats={stats} recentPayments={formattedPayments} />
}
