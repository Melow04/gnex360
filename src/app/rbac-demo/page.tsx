import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/rbac'
import { RoleGate } from '@/components/RoleGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function RBACDemoPage() {
  const { userId, sessionClaims } = await auth()
  const role = await getUserRole()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">RBAC Demo Page</h1>
        <p className="text-muted-foreground mt-2">
          Testing role-based access control
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Info</CardTitle>
          <CardDescription>Server-side rendered role information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">User ID:</span>
            <span className="font-mono text-sm">{userId || 'Not logged in'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Role:</span>
            {role ? (
              <Badge variant="default">{role}</Badge>
            ) : (
              <Badge variant="outline">No role assigned</Badge>
            )}
          </div>
          {!role && (
            <p className="text-sm text-yellow-600 mt-4">
              ⚠️ You don't have a role assigned yet. Go to Clerk Dashboard → Users → Your User → Set Public Metadata: {`{ "role": "owner" }`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Role-Based UI Gating Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">UI Gating Examples (Client-Side)</h2>
        <p className="text-sm text-muted-foreground">
          These elements are hidden/shown based on your role. ⚠️ This is NOT security - always protect APIs!
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Everyone can see this */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Public Card</CardTitle>
              <CardDescription>Everyone can see this</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">No role required</p>
            </CardContent>
          </Card>

          {/* Owner only */}
          <RoleGate allow={['owner']}>
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">👑 Owner Only</CardTitle>
                <CardDescription>Only owner role sees this</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">You are the owner!</p>
              </CardContent>
            </Card>
          </RoleGate>

          {/* Owner or Coach */}
          <RoleGate allow={['owner', 'coach']}>
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">👥 Staff Only</CardTitle>
                <CardDescription>Owner or Coach</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">You have staff access</p>
              </CardContent>
            </Card>
          </RoleGate>

          {/* Dev only */}
          <RoleGate allow={['dev']}>
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">🔧 Dev Only</CardTitle>
                <CardDescription>Developer role</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Debug mode enabled</p>
              </CardContent>
            </Card>
          </RoleGate>

          {/* Client only */}
          <RoleGate allow={['client']}>
            <Card>
              <CardHeader>
                <CardTitle className="text-teal-600">💪 Member Only</CardTitle>
                <CardDescription>Client role</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Member features here</p>
              </CardContent>
            </Card>
          </RoleGate>

          {/* Multiple roles */}
          <RoleGate allow={['owner', 'dev', 'coach']}>
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-600">🛡️ All Staff</CardTitle>
                <CardDescription>Owner, Dev, or Coach</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Administrative access</p>
              </CardContent>
            </Card>
          </RoleGate>
        </div>
      </div>

      {/* Button Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Button Gating Examples</h2>
        
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-gray-200 rounded">
            Public Button (Everyone)
          </button>

          <RoleGate allow={['owner']}>
            <button className="px-4 py-2 bg-purple-500 text-white rounded">
              Owner Settings
            </button>
          </RoleGate>

          <RoleGate allow={['owner', 'coach']}>
            <button className="px-4 py-2 bg-blue-500 text-white rounded">
              Manage Members
            </button>
          </RoleGate>

          <RoleGate allow={['client']}>
            <button className="px-4 py-2 bg-teal-500 text-white rounded">
              My Membership
            </button>
          </RoleGate>

          <RoleGate 
            allow={['owner']} 
            fallback={
              <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded" disabled>
                Delete All (Owner Only)
              </button>
            }
          >
            <button className="px-4 py-2 bg-red-500 text-white rounded">
              Delete All Data
            </button>
          </RoleGate>
        </div>
      </div>

      {/* Testing Instructions */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle>🧪 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Assign Your Role</h3>
            <p className="text-sm text-muted-foreground">
              Go to <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-500 underline">Clerk Dashboard</a> → Users → Select your user → Edit Public Metadata
            </p>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
{`{ "role": "owner" }`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Test Different Roles</h3>
            <p className="text-sm text-muted-foreground">
              Change your role to: <code>owner</code>, <code>coach</code>, <code>dev</code>, or <code>client</code>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              After changing, sign out and sign back in to refresh your session.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Try Protected Routes</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><a href="/admin/dashboard" className="text-blue-500 underline">/admin/dashboard</a> - Requires owner or coach</li>
              <li><a href="/admin/plans" className="text-blue-500 underline">/admin/plans</a> - Requires owner or coach</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Info (Raw Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{JSON.stringify({
  userId,
  role,
  publicMetadata: sessionClaims?.publicMetadata,
}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
