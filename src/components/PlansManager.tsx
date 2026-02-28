'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PlanItem = {
  id: string
  name: string
  durationDays: number
  price: number
  isActive: boolean
  subscriptionsCount: number
}

type CreateState = {
  name: string
  durationDays: string
  price: string
  isActive: 'true' | 'false'
}

type EditState = {
  id: string
  name: string
  durationDays: string
  price: string
  isActive: 'true' | 'false'
}

export function PlansManager({ initialPlans }: { initialPlans: PlanItem[] }) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans)
  const [create, setCreate] = useState<CreateState>({
    name: '',
    durationDays: '',
    price: '',
    isActive: 'true',
  })
  const [editing, setEditing] = useState<EditState | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => a.durationDays - b.durationDays),
    [plans]
  )

  function upsertPlan(nextPlan: PlanItem) {
    setPlans((prev) => {
      const index = prev.findIndex((item) => item.id === nextPlan.id)
      if (index === -1) return [nextPlan, ...prev]
      const copy = [...prev]
      copy[index] = nextPlan
      return copy
    })
  }

  async function createPlan() {
    setError(null)
    setSuccess(null)
    setIsCreating(true)

    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: create.name,
          durationDays: Number(create.durationDays),
          price: Number(create.price),
          isActive: create.isActive === 'true',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create plan')
        return
      }

      upsertPlan(data.plan)
      setCreate({ name: '', durationDays: '', price: '', isActive: 'true' })
      setSuccess('Plan created successfully')
    } catch {
      setError('Failed to create plan')
    } finally {
      setIsCreating(false)
    }
  }

  async function updatePlan() {
    if (!editing) return

    setError(null)
    setSuccess(null)
    setBusyPlanId(editing.id)

    try {
      const response = await fetch(`/api/admin/plans/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          durationDays: Number(editing.durationDays),
          price: Number(editing.price),
          isActive: editing.isActive === 'true',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update plan')
        return
      }

      upsertPlan(data.plan)
      setEditing(null)
      setSuccess('Plan updated successfully')
    } catch {
      setError('Failed to update plan')
    } finally {
      setBusyPlanId(null)
    }
  }

  async function deletePlan(planId: string) {
    setError(null)
    setSuccess(null)
    setBusyPlanId(planId)

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete plan')
        return
      }

      setPlans((prev) => prev.filter((item) => item.id !== planId))
      setSuccess('Plan deleted successfully')
    } catch {
      setError('Failed to delete plan')
    } finally {
      setBusyPlanId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Create Plan</CardTitle>
          <CardDescription>Create a new plan template for subscriptions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Plan Name</Label>
              <Input
                value={create.name}
                onChange={(event) => setCreate((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Semi-Annual"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                min={1}
                value={create.durationDays}
                onChange={(event) =>
                  setCreate((prev) => ({ ...prev, durationDays: event.target.value }))
                }
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label>Price (₱)</Label>
              <Input
                type="number"
                min={1}
                step="0.01"
                value={create.price}
                onChange={(event) => setCreate((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="799"
              />
            </div>
          </div>

          <div className="space-y-2 max-w-xs">
            <Label>Status</Label>
            <Select
              value={create.isActive}
              onValueChange={(value: 'true' | 'false') =>
                setCreate((prev) => ({ ...prev, isActive: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button onClick={createPlan} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Plan'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {orderedPlans.map((plan) => (
          <Card key={plan.id} className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{plan.name}</span>
                <Badge variant={plan.isActive ? 'default' : 'outline'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription>{plan.durationDays} days duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">₱{plan.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">+ ₱500 membership fee (one-time)</p>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>{plan.subscriptionsCount}</strong> subscriptions
              </p>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setEditing({
                          id: plan.id,
                          name: plan.name,
                          durationDays: String(plan.durationDays),
                          price: String(plan.price),
                          isActive: plan.isActive ? 'true' : 'false',
                        })
                      }
                    >
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Plan</DialogTitle>
                      <DialogDescription>Edit plan details and status.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={editing?.id === plan.id ? editing.name : ''}
                          onChange={(event) =>
                            setEditing((prev) =>
                              prev && prev.id === plan.id
                                ? { ...prev, name: event.target.value }
                                : prev
                            )
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Duration (days)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={editing?.id === plan.id ? editing.durationDays : ''}
                            onChange={(event) =>
                              setEditing((prev) =>
                                prev && prev.id === plan.id
                                  ? { ...prev, durationDays: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Price (₱)</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.01"
                            value={editing?.id === plan.id ? editing.price : ''}
                            onChange={(event) =>
                              setEditing((prev) =>
                                prev && prev.id === plan.id
                                  ? { ...prev, price: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={editing?.id === plan.id ? editing.isActive : 'true'}
                          onValueChange={(value: 'true' | 'false') =>
                            setEditing((prev) =>
                              prev && prev.id === plan.id ? { ...prev, isActive: value } : prev
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        onClick={updatePlan}
                        disabled={busyPlanId === plan.id || !editing || editing.id !== plan.id}
                      >
                        {busyPlanId === plan.id ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  onClick={() => deletePlan(plan.id)}
                  disabled={busyPlanId === plan.id}
                >
                  {busyPlanId === plan.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orderedPlans.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No plans yet. Create your first plan above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
