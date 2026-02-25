import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function PlansPage() {
  // Protect the page
  await requireOwnerOrCoach()

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { durationDays: 'asc' },
    include: {
      _count: {
        select: { subscriptions: true }
      }
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Membership Plans</h1>
        <p className="text-muted-foreground">
          Available subscription plans for gym members
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.isActive && (
                  <Badge variant="default">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {plan.durationDays} days duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">₱{plan.price.toString()}</p>
                  <p className="text-sm text-muted-foreground">
                    + ₱500 membership fee (one-time)
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>{plan._count.subscriptions}</strong> active subscriptions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No active plans available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
