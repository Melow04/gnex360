import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { PlansManager } from '@/components/PlansManager'

export default async function PlansPage() {
  // Protect the page - check role from Clerk metadata
  const check = await requireOwnerOrCoach()
  
  if (!check.ok) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="text-muted-foreground mt-2">
            You need owner or coach role to access this page.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Current role: {check.role || 'none'}
          </p>
        </div>
      </div>
    )
  }

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { subscriptions: true }
      }
    }
  })

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Membership Plans</h1>
          <p className="text-muted-foreground">
            Available subscription plans for gym members
          </p>
        </div>
      </div>

      <PlansManager
        initialPlans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          durationDays: plan.durationDays,
          price: Number(plan.price),
          isActive: plan.isActive,
          subscriptionsCount: plan._count.subscriptions,
        }))}
      />
    </div>
  )
}
