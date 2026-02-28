import Link from 'next/link'
import { format } from 'date-fns'
import { Role, UserStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type AccountsSearchParams = Promise<{
  q?: string
  role?: string
  status?: string
}>

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: AccountsSearchParams
}) {
  const check = await requireOwnerOrCoach()

  if (!check.ok) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">You need owner or coach role to access this page.</p>
      </div>
    )
  }

  const params = await searchParams
  const query = params.q?.trim() || ''
  const roleParam = params.role?.trim().toUpperCase() || ''
  const statusParam = params.status?.trim().toUpperCase() || ''

  const where: {
    OR?: Array<{
      firstName?: { contains: string; mode: 'insensitive' }
      lastName?: { contains: string; mode: 'insensitive' }
      email?: { contains: string; mode: 'insensitive' }
    }>
    role?: Role
    status?: UserStatus
  } = {}

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (roleParam && Object.values(Role).includes(roleParam as Role)) {
    where.role = roleParam as Role
  }

  if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
    where.status = statusParam as UserStatus
  }

  const accounts = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter((account) => account.status === 'ACTIVE').length
  const coachAccounts = accounts.filter((account) => account.role === 'COACH').length
  const clientAccounts = accounts.filter((account) => account.role === 'CLIENT').length

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Feature Module / Accounts
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Account List</h1>
        <p className="text-muted-foreground">View all registered accounts and their roles.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAccounts}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeAccounts}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{coachAccounts}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clientAccounts}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Filter Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="GET">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Name or email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue={params.role || ''}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All roles</option>
                <option value="owner">Owner</option>
                <option value="coach">Coach</option>
                <option value="client">Client</option>
                <option value="dev">Dev</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={params.status || ''}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <Button type="submit">Apply Filters</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/accounts">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>All Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No accounts found.</p>
          ) : (
            <div className="rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.firstName} {account.lastName}
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.role.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.status.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>{format(account.createdAt, 'MMM dd, yyyy')}</TableCell>
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
