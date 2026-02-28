import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/rbac'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/LogoutButton'

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = await getUserRole()

  if (role === 'owner' || role === 'coach' || role === 'dev') {
    redirect('/admin/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <Card className="w-full max-w-2xl border-border/70 bg-card/90">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-wide">
              Account Onboarding
            </Badge>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight">Welcome to GNEX 360</CardTitle>
            <CardDescription className="text-base">
              Your account is active. Access is controlled by role assignment from an admin.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-background p-4 text-sm">
            {role ? (
              <>
                <p className="font-medium">Current role: {role}</p>
                <p className="mt-1 text-muted-foreground">
                  Your role is already assigned. Click <strong>Check Access</strong> to continue.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Waiting for role designation</p>
                <p className="mt-1 text-muted-foreground">
                  Please ask an admin to assign you a role (client or coach). Once assigned, your access
                  will be enabled.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard">Check Access</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
