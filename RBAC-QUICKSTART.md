# RBAC Quick Start

**Get RBAC working in 5 minutes.**

## Step 1: Set Your Role

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **Users** in sidebar
3. Click on your user
4. Scroll to **Public metadata**
5. Click **Edit**, add this:
   ```json
   {
     "role": "owner"
   }
   ```
6. Click **Save**

## Step 2: Sign Out & Sign In

Refresh your session:
- Click sign out
- Sign back in

## Step 3: Test It

Visit these pages:

### ✅ Should Work (you have `owner`)
- http://localhost:3000/admin/dashboard
- http://localhost:3000/admin/plans
- http://localhost:3000/rbac-demo

### Test RBAC Demo Page
- http://localhost:3000/rbac-demo
- See which cards appear based on your role
- Try changing your role to `coach`, `client`, or `dev`

## Step 4: Create Test Users

Create additional test accounts with different roles:

1. **Coach Account**
   - Sign up at `/sign-up`
   - Set role to `"coach"` in Clerk
   - Test: Can access `/admin/dashboard` ✅
   - Test: Can create memberships ✅

2. **Client Account**  
   - Sign up at `/sign-up`
   - Set role to `"client"` in Clerk
   - Test: Cannot access `/admin/dashboard` ❌
   - Test: Shows "Unauthorized" message

## Available Roles

- `owner` - Full admin access
- `dev` - Developer/debug access
- `coach` - Staff member, can manage clients
- `client` - Regular gym member
- `visitor` - Guest (if needed)

## Protected Routes

### Require `owner` or `coach`:
- `/admin/dashboard`
- `/admin/plans`
- `POST /api/memberships`
- `GET /api/dashboard/summary`

### Public (no auth needed):
- `/` (home)
- `/sign-in`
- `/sign-up`
- `POST /api/entry/scan` (QR scanner)

## Using RBAC in Your Code

### Server Page (TypeScript)
```typescript
import { requireOwner } from '@/lib/rbac'

export default async function MyPage() {
  const check = requireOwner()
  if (!check.ok) return <div>Unauthorized</div>
  
  return <div>Owner content</div>
}
```

### API Route (TypeScript)
```typescript
import { requireOwnerOrCoach } from '@/lib/rbac'
import { NextResponse } from 'next/server'

export async function POST() {
  const check = requireOwnerOrCoach()
  if (!check.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  return NextResponse.json({ success: true })
}
```

### Client Component (TSX)
```tsx
import { RoleGate } from '@/components/RoleGate'

export function MyComponent() {
  return (
    <div>
      <RoleGate allow={['owner', 'coach']}>
        <button>Admin Button</button>
      </RoleGate>
    </div>
  )
}
```

## Need More Help?

Read the **[Complete RBAC Guide](RBAC-GUIDE.md)**

## Quick Troubleshooting

**"Unauthorized" even though I set my role**
- Sign out and sign back in
- Check Clerk Dashboard that role is actually saved
- Visit `/rbac-demo` to see your current role

**UI elements not hiding**
- Make sure component has `'use client'` at top
- Check browser console for errors
- Remember: UI gating is cosmetic, APIs must still be protected

**Role is showing as `null`**
- You haven't set `publicMetadata.role` in Clerk yet
- Go to Clerk Dashboard and add it
