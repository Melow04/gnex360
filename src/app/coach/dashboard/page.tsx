import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { getUserRole } from '@/lib/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function CoachDashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = await getUserRole()

  if (role !== 'coach') {
    redirect('/dashboard')
  }

  const today = startOfDay(new Date())

  const [activeClients, todayEntries, activeSubscriptions] = await Promise.all([
    prisma.user.count({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE',
      },
    }),
    prisma.entryLog.count({
      where: {
        entryTime: {
          gte: today,
        },
      },
    }),
    prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
    }),
  ])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Coach Dashboard
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Coach Overview</h1>
        <p className="text-muted-foreground">Track today’s gym activity and member operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeClients}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today&apos;s Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayEntries}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeSubscriptions}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Open the modules you use most often as a coach.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/entry-logs">Entry Logs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/personal-plans">Personal Plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/settings">Account Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
