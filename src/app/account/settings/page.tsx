import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AccountSettingsForm } from '@/components/AccountSettingsForm'
import { getUserRole } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

export default async function AccountSettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = await getUserRole()

  const backHref =
    role === 'owner' || role === 'dev'
      ? '/admin/dashboard'
      : role === 'coach'
        ? '/coach/dashboard'
        : role === 'client'
          ? '/member/dashboard'
          : '/dashboard'

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Button asChild variant="outline" className="w-fit">
        <Link href={backHref}>Back</Link>
      </Button>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account details.</p>
      </div>

      <AccountSettingsForm />
    </div>
  )
}
