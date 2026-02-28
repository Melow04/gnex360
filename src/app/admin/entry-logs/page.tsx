import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { ManualEntryForm } from '@/components/ManualEntryForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { startOfDay, subDays, format } from 'date-fns'

export default async function EntryLogsPage() {
  const check = await requireOwnerOrCoach()

  if (!check.ok) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">You need owner or coach role to access this page.</p>
      </div>
    )
  }

  const today = startOfDay(new Date())
  const sevenDaysAgo = subDays(today, 6)

  const [todayCount, weeklyCount, totalCount, recentLogs] = await Promise.all([
    prisma.entryLog.count({
      where: {
        entryTime: {
          gte: today,
        },
      },
    }),
    prisma.entryLog.count({
      where: {
        entryTime: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.entryLog.count(),
    prisma.entryLog.findMany({
      orderBy: {
        entryTime: 'desc',
      },
      take: 100,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Feature Module / Entry Logs
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Gym Entry Logging</h1>
        <p className="text-muted-foreground">Monitor and review member check-in activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today's Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weeklyCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Logged Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      <ManualEntryForm />

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>Latest 100 entry logs recorded by the scanner.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No entry logs yet.</p>
          ) : (
            <div className="rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(log.entryTime, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(log.entryTime, 'hh:mm a')}</TableCell>
                      <TableCell className="font-medium">
                        {log.user.firstName} {log.user.lastName}
                      </TableCell>
                      <TableCell>{log.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.method}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
