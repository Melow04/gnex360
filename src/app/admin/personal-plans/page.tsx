import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { PersonalPlansManager } from '@/components/PersonalPlansManager'
import { Role } from '@prisma/client'

export default async function PersonalPlansPage() {
  const check = await requireOwnerOrCoach()

  if (!check.ok) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">You need owner or coach role to access this page.</p>
      </div>
    )
  }

  const [users, plans, memberships] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: [Role.CLIENT, Role.COACH],
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
    prisma.plan.findMany({
      orderBy: { durationDays: 'asc' },
      select: {
        id: true,
        name: true,
        durationDays: true,
        price: true,
        isActive: true,
      },
    }),
    prisma.membership.findMany({
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
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Feature Module / Personal Plans
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Personal Plan Management</h1>
        <p className="text-muted-foreground">
          Assign, view, update, and cancel personal plans for each person.
        </p>
      </div>

      <PersonalPlansManager
        users={users}
        plans={plans.map((plan) => ({
          ...plan,
          price: Number(plan.price),
        }))}
        initialMemberships={memberships.map((membership) => ({
          id: membership.id,
          userId: membership.userId,
          planId: membership.planId,
          status: membership.status,
          startDate: membership.startDate.toISOString(),
          endDate: membership.endDate.toISOString(),
          membershipFee: Number(membership.membershipFee),
          user: membership.user,
          plan: {
            ...membership.plan,
            price: Number(membership.plan.price),
          },
        }))}
      />
    </div>
  )
}
