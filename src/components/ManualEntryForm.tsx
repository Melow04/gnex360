'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function ManualEntryForm() {
  const [entryType, setEntryType] = useState<'member' | 'walkin'>('member')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/entry/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          isWalkIn: entryType === 'walkin',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to log entry')
        return
      }

      setSuccess(`Manual entry logged for ${data.user.name}.`)
      setEmail('')
      setFirstName('')
      setLastName('')
      setPhone('')
      router.refresh()
    } catch {
      setError('Failed to log entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Manual Entry</CardTitle>
        <CardDescription>
          Use this when QR scanning is unavailable. Enter member email to log check-in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Entry Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={entryType === 'member' ? 'default' : 'outline'}
                onClick={() => setEntryType('member')}
              >
                Member
              </Button>
              <Button
                type="button"
                variant={entryType === 'walkin' ? 'default' : 'outline'}
                onClick={() => setEntryType('walkin')}
              >
                Walk-in Client
              </Button>
            </div>
          </div>

          {entryType === 'walkin' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="walkin-first-name">First Name</Label>
                <Input
                  id="walkin-first-name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walkin-last-name">Last Name</Label>
                <Input
                  id="walkin-last-name"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manual-email">Member Email</Label>
            <Input
              id="manual-email"
              type="email"
              required={entryType === 'member'}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={entryType === 'member' ? 'member@example.com' : 'walkin@example.com (optional)'}
            />
          </div>

          {entryType === 'walkin' && (
            <div className="space-y-2">
              <Label htmlFor="walkin-phone">Phone (optional)</Label>
              <Input
                id="walkin-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+639171234567"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging Entry...' : entryType === 'walkin' ? 'Log Walk-in Entry' : 'Log Manual Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
