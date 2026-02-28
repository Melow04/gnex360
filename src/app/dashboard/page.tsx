import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/rbac'

export default async function DashboardRedirectPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = await getUserRole()

  if (role === 'owner' || role === 'dev') {
    redirect('/admin/dashboard')
  }

  if (role === 'coach') {
    redirect('/coach/dashboard')
  }

  if (role === 'client') {
    redirect('/member/dashboard')
  }

  if (!role || role === 'visitor') {
    redirect('/onboarding')
  }

  redirect('/onboarding')
}
