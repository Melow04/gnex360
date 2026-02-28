'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

type UserOption = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type PlanOption = {
  id: string
  name: string
  durationDays: number
  price: number
  isActive: boolean
}

type MembershipRow = {
  id: string
  userId: string
  planId: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  startDate: string
  endDate: string
  membershipFee: number
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  plan: {
    id: string
    name: string
    durationDays: number
    price: number
  }
}

type Props = {
  users: UserOption[]
  plans: PlanOption[]
  initialMemberships: MembershipRow[]
}

export function PersonalPlansManager({ users, plans, initialMemberships }: Props) {
  const [memberships, setMemberships] = useState<MembershipRow[]>(initialMemberships)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [rowPlanSelections, setRowPlanSelections] = useState<Record<string, string>>({})
  const [isAssigning, setIsAssigning] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activePlans = useMemo(() => plans.filter((plan) => plan.isActive), [plans])

  function upsertMembership(nextMembership: MembershipRow) {
    setMemberships((prev) => {
      const index = prev.findIndex((item) => item.id === nextMembership.id)
      if (index === -1) return [nextMembership, ...prev]
      const copy = [...prev]
      copy[index] = nextMembership
      return copy
    })
  }

  async function assignPersonalPlan() {
    setError(null)
    setSuccess(null)

    if (!selectedUserId || !selectedPlanId) {
      setError('Please select both member and plan')
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch('/api/admin/personal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, planId: selectedPlanId }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to assign personal plan')
        return
      }

      upsertMembership(data.membership)
      setSelectedUserId('')
      setSelectedPlanId('')
      setSuccess(data.message || 'Personal plan assigned')
    } catch {
      setError('Failed to assign personal plan')
    } finally {
      setIsAssigning(false)
    }
  }

  async function updatePersonalPlan(membershipId: string) {
    setError(null)
    setSuccess(null)

    const planId = rowPlanSelections[membershipId]
    if (!planId) {
      setError('Select a new plan to update')
      return
    }

    setBusyId(membershipId)
    try {
      const response = await fetch(`/api/admin/personal-plans/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update personal plan')
        return
      }

      upsertMembership(data.membership)
      setRowPlanSelections((prev) => ({ ...prev, [membershipId]: '' }))
      setSuccess(data.message || 'Personal plan updated')
    } catch {
      setError('Failed to update personal plan')
    } finally {
      setBusyId(null)
    }
  }

  async function cancelPersonalPlan(membershipId: string) {
    setError(null)
    setSuccess(null)

    setBusyId(membershipId)
    try {
      const response = await fetch(`/api/admin/personal-plans/${membershipId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel personal plan')
        return
      }

      setMemberships((prev) =>
        prev.map((item) =>
          item.id === membershipId
            ? {
                ...item,
                status: 'SUSPENDED',
                endDate: new Date(data.membership.endDate).toISOString(),
              }
            : item
        )
      )
      setSuccess(data.message || 'Personal plan cancelled')
    } catch {
      setError('Failed to cancel personal plan')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Assign Personal Plan</CardTitle>
          <CardDescription>Select a person and assign a plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Person</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Plan</p>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} • {plan.durationDays} days • ₱{plan.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button onClick={assignPersonalPlan} disabled={isAssigning}>
            {isAssigning ? 'Assigning...' : 'Assign Personal Plan'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Personal Plan List</CardTitle>
          <CardDescription>View, update, and cancel assigned personal plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No personal plans assigned yet.</p>
          ) : (
            <div className="rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Update Plan</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {membership.user.firstName} {membership.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{membership.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{membership.plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₱{membership.plan.price.toLocaleString()} • {membership.plan.durationDays} days
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.status === 'ACTIVE' ? 'default' : 'outline'}>
                          {membership.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(membership.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(membership.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Select
                          value={rowPlanSelections[membership.id] || ''}
                          onValueChange={(value) =>
                            setRowPlanSelections((prev) => ({ ...prev, [membership.id]: value }))
                          }
                        >
                          <SelectTrigger className="w-55">
                            <SelectValue placeholder="Select new plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {activePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} • {plan.durationDays}d
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePersonalPlan(membership.id)}
                          disabled={busyId === membership.id}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelPersonalPlan(membership.id)}
                          disabled={busyId === membership.id || membership.status === 'SUSPENDED'}
                        >
                          Cancel
                        </Button>
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
