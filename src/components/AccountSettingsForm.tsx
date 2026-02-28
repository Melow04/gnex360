'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type AccountProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  status: string
}

export function AccountSettingsForm() {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/account/settings', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load account settings')
          return
        }

        const loadedProfile = data.profile as AccountProfile
        setProfile(loadedProfile)
        setFirstName(loadedProfile.firstName || '')
        setLastName(loadedProfile.lastName || '')
        setPhone(loadedProfile.phone || '')
      } catch {
        setError('Failed to load account settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update settings')
        return
      }

      const updatedProfile = data.profile as AccountProfile
      setProfile(updatedProfile)
      setSuccess(data.message || 'Account settings updated successfully')
    } catch {
      setError('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Update your personal account information.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading account settings...</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ''} readOnly disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+639171234567"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Role: {profile?.role || 'client'}</Badge>
              <Badge variant="outline">Status: {profile?.status || 'active'}</Badge>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
