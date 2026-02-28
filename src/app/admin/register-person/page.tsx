import { requireOwnerOrCoach } from '@/lib/rbac'
import { RegisterPersonForm } from '@/components/RegisterPersonForm'

export default async function RegisterPersonPage() {
  const check = await requireOwnerOrCoach()

  if (!check.ok) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">You need owner or coach role to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Feature Module / Register
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Register Person</h1>
        <p className="text-muted-foreground">
          Admins can assign a person as client or coach using their email.
        </p>
      </div>

      <RegisterPersonForm />
    </div>
  )
}
