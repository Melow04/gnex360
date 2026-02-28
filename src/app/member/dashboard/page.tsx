import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { getMembershipStatus } from '@/lib/membership'
import { getUserRole } from '@/lib/rbac'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberEntryQrCard } from '@/components/MemberEntryQrCard'

export default async function MemberDashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = await getUserRole()

  if (role !== 'client') {
    redirect('/dashboard')
  }

  const account = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      membership: {
        include: {
          plan: true,
        },
      },
      entryLogs: {
        orderBy: {
          entryTime: 'desc',
        },
        take: 5,
      },
    },
  })

  if (!account) {
    redirect('/onboarding')
  }

  const membershipStatus = account.membership ? getMembershipStatus(account.membership) : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Member Dashboard
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {account.firstName}
        </h1>
        <p className="text-muted-foreground">View your membership and latest check-ins.</p>
      </div>

      <MemberEntryQrCard />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>Your current subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {account.membership ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{account.membership.plan.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={membershipStatus?.isActive ? 'default' : 'outline'}>
                    {membershipStatus?.message || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Ends On</p>
                  <p className="font-medium">
                    {format(account.membership.endDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="font-medium">{membershipStatus?.daysRemaining ?? 0}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active membership found yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-right font-medium">{account.firstName} {account.lastName}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-right font-medium">{account.email}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-right font-medium">{account.phone || '-'}</p>
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/account/settings">Update Account Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>Your latest 5 entry logs.</CardDescription>
        </CardHeader>
        <CardContent>
          {account.entryLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins yet.</p>
          ) : (
            <div className="space-y-2">
              {account.entryLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{format(log.entryTime, 'MMM dd, yyyy')}</p>
                    <Badge variant="outline">{log.method}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{format(log.entryTime, 'hh:mm a')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
