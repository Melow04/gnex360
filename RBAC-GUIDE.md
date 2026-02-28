# RBAC Setup Guide (MVP)

**Role-Based Access Control** using Clerk authentication + manual role assignment.

## Table of Contents

- [A) Roles Defined](#a-roles-defined)
- [B) Authentication Setup](#b-authentication-setup)
- [C) Assign Roles](#c-assign-roles-manual)
- [D) Route Protection](#d-route-protection-middleware)
- [E) Server-Side Protection](#e-server-side-protection)
- [F) Client-Side UI Gating](#f-client-side-ui-gating)
- [G) Testing Checklist](#g-testing-checklist)

---

## A) Roles Defined

Your system has these roles (defined in `src/lib/rbac.ts`):

| Role | Description | Access Level |
|------|-------------|--------------|
| `owner` | Gym owner | Full access to everything |
| `dev` | Developer | Technical access for debugging |
| `coach` | Staff member | Can manage members & memberships |
| `client` | Regular member | Basic member features |
| `visitor` | Guest (optional) | Limited/public access |

**Security Rule:** ⚠️ Only server-side checks count for security!

---

## B) Authentication Setup

### ✅ Already Configured

Your app already has Clerk authentication set up:

1. **Environment variables** (`.env`):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```

2. **Root layout** (`src/app/layout.tsx`):
   - Wrapped with `<ClerkProvider>`

3. **Auth pages**:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`

---

## C) Assign Roles (Manual)

### How to Set User Roles

Assign roles directly in Clerk for MVP:

#### Method 1: Clerk Dashboard (Easiest!)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Users** in sidebar
4. Click on a user
5. Scroll to **Public metadata**
6. Click **Edit**
7. Add:
   ```json
   {
        "role": "owner"
   }
   ```
   Replace `"owner"` with: `"owner"`, `"dev"`, `"coach"`, `"client"`, or `"visitor"`
8. Click **Save**

#### Method 2: Programmatically (Future Enhancement)

You can update roles via API using Clerk's SDK:
```typescript
import { clerkClient } from '@clerk/nextjs/server'

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'coach'
  }
})
```

---

## D) Route Protection (Middleware)

### Global Protection

File: `middleware.ts`

All routes require authentication **except**:
- `/` (home page)
- `/sign-in`, `/sign-up` (auth pages)
- `/api/entry/scan` (public QR scanner)

**How it works:**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/entry/scan(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect() // Require login for all other routes
  }
})
```

✅ This is already configured!

---

## E) Server-Side Protection

### Protect Pages with Roles

File: `src/lib/rbac.ts` provides these helpers:

#### Basic Function

```typescript
import { requireRole } from '@/lib/rbac'

const check = requireRole(['owner', 'coach'])

if (!check.ok) {
  // Show error or redirect
  return <div>Unauthorized</div>
}

// Continue with authorized code
```

#### Helper Functions

```typescript
requireOwner()              // Only 'owner'
requireOwnerOrDev()         // 'owner' or 'dev'
requireOwnerOrCoach()       // 'owner' or 'coach'
requireStaff()              // 'owner', 'dev', or 'coach'
```

### Example: Protected Page

File: `src/app/admin/dashboard/page.tsx`

```typescript
import { requireOwnerOrCoach } from '@/lib/rbac'

export default async function DashboardPage() {
  // Check role
  const check = requireOwnerOrCoach()
  
  if (!check.ok) {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You need owner or coach role.</p>
        <p>Current role: {check.role || 'none'}</p>
      </div>
    )
  }

  // Protected content
  return <div>Welcome to admin dashboard!</div>
}
```

### Example: Protected API Route

File: `src/app/api/admin/stats/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/rbac'

export async function GET() {
  const check = requireOwner()
  
  if (!check.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', role: check.role || 'none' },
      { status: 403 }
    )
  }
  
  // Protected logic
  return NextResponse.json({ data: 'secret stats' })
}
```

---

## F) Client-Side UI Gating

**⚠️ NOT FOR SECURITY** - Only for better UX

File: `src/components/RoleGate.tsx`

### Basic Usage

```tsx
import { RoleGate } from '@/components/RoleGate'

export function AdminMenu() {
  return (
    <div>
      {/* Everyone sees this */}
      <button>Home</button>
      
      {/* Only owner/coach see this */}
      <RoleGate allow={['owner', 'coach']}>
        <button>Admin Panel</button>
      </RoleGate>
      
      {/* Only owner sees this */}
      <RoleGate allow={['owner']}>
        <button>Owner Settings</button>
      </RoleGate>
    </div>
  )
}
```

### With Fallback

```tsx
<RoleGate 
  allow={['owner']} 
  fallback={<button disabled>Upgrade to Owner</button>}
>
  <button>Delete Everything</button>
</RoleGate>
```

### Inverse Gate (Show to Non-Admins)

```tsx
import { RoleGateInverse } from '@/components/RoleGate'

<RoleGateInverse allow={['owner', 'coach']}>
  <div>Client-only content</div>
</RoleGateInverse>
```

---

## G) Testing Checklist

### ✅ Test Steps

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Sign up a new user**
   - Go to http://localhost:3000/sign-up
   - Create an account

3. **Set role in Clerk Dashboard**
   - Go to Clerk Dashboard → Users
   - Click your user
   - Set `publicMetadata`: `{ "role": "client" }`
   - Save

4. **Test access levels**

   | Test | Expected Result |
   |------|-----------------|
   | Access `/admin/dashboard` without login | Redirected to sign-in |
   | Access `/admin/dashboard` as `client` | "Unauthorized" message |
   | Access `/admin/dashboard` as `coach` | Dashboard loads ✅ |
   | Access `/admin/dashboard` as `owner` | Dashboard loads ✅ |
   | Call `/api/dashboard/summary` as `client` | 403 Forbidden |
   | Call `/api/dashboard/summary` as `owner` | Returns data ✅ |

5. **Test UI gating**
   - Elements wrapped in `<RoleGate>` should hide based on role
   - Check browser DevTools to confirm they're not in DOM

### Quick Test Script

```bash
# Test 1: Public route (should work)
curl http://localhost:3000/

# Test 2: Protected API without auth (should fail)
curl http://localhost:3000/api/dashboard/summary

# Test 3: Protected API with wrong role (need to add auth header)
# You'll need to get a session token from browser DevTools
```

---

## Role Assignment Strategies

### Development Phase (Current)

**Manual assignment via Clerk Dashboard**
- ✅ Simple and fast
- ✅ No code needed
- ❌ Manual work for each user

### Production Phase (Future)

**Option A: Onboarding Page**
- User signs up → shown form to select role
- Form submits to API that updates Clerk metadata
- Good for self-service role selection

**Option B: Admin Panel**
- Owner/Admin can assign roles to users
- Build a `/admin/users` page with role dropdown

---

## Existing Protected Routes

These routes already have RBAC protection:

### Admin Pages
- `/admin/dashboard` - Requires `owner` or `coach`
- `/admin/plans` - Requires `owner` or `coach`

### API Routes
- `POST /api/memberships` - Requires `owner` or `coach`
- `GET /api/dashboard/summary` - Requires `owner` or `coach`
- `PATCH /api/users/[id]/status` - Check implementation

### Public Routes (No Protection)
- `POST /api/entry/scan` - QR code scanning
- `POST /api/users/register` - User registration

---

## Adding New Protected Routes

### 1. Protect a New Page

Create: `src/app/admin/settings/page.tsx`

```typescript
import { requireOwner } from '@/lib/rbac'

export default async function SettingsPage() {
  const check = await requireOwner()
  
  if (!check.ok) {
    return <div>Only owners can access settings</div>
  }
  
  return <div>Settings Page</div>
}
```

### 2. Protect a New API Route

Create: `src/app/api/admin/delete-all/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/rbac'

export async function DELETE() {
  const check = await requireOwner()
  
  if (!check.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Dangerous operation - owner only!
  return NextResponse.json({ success: true })
}
```

---

## Debugging Tips

### Check What Role User Has

Create a debug page: `src/app/debug/page.tsx`

```typescript
import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/rbac'

export default async function DebugPage() {
  const { userId, sessionClaims } = await auth()
  const role = await getUserRole()
  
  return (
    <div>
      <h1>Debug Info</h1>
      <p>User ID: {userId}</p>
      <p>Role: {role || 'NONE'}</p>
      <pre>{JSON.stringify(sessionClaims?.publicMetadata, null, 2)}</pre>
    </div>
  )
}
```

### Common Issues

**Issue: Role is `null`**
- User doesn't have `publicMetadata.role` set in Clerk
- Go to Clerk Dashboard and set it

**Issue: Still getting "Unauthorized"**
- Clear browser cache/cookies
- Sign out and sign in again (refresh session)
- Check Clerk Dashboard that role is saved

**Issue: Role gate not hiding UI**
- Make sure component is marked `'use client'`
- Check browser console for errors

---

## Security Best Practices

1. **Always check roles server-side** ✅ CRITICAL
   - Never trust client-side checks alone
   - Every protected API must check roles

2. **Use middleware for authentication** ✅
   - Already configured
   - Ensures user is logged in before role check

3. **UI gating is UX, not security** ⚠️
   - Use `<RoleGate>` to hide buttons
   - Still protect the actual API endpoints

4. **Don't expose sensitive data in errors**
   ```typescript
   // ❌ Bad
   return NextResponse.json({ error: 'Only owner can access this' })
   
   // ✅ Good  
   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
   ```

5. **Log unauthorized attempts** 📝
   ```typescript
   if (!check.ok) {
     console.warn(`Unauthorized access attempt by ${check.role}`)
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
   }
   ```

---

## Next Steps

### Immediate Actions

1. ✅ **Test current implementation**
   - Follow the testing checklist above

2. ✅ **Assign yourself owner role**
   - Go to Clerk Dashboard
   - Set your role to `"owner"`

3. ✅ **Create a test client user**
   - Sign up another account
   - Set role to `"client"`
   - Test that they can't access admin pages

### Future Enhancements

- [ ] Build admin panel for role management
- [ ] Add audit logging for role changes
- [ ] Implement permission-based checks (not just roles)
- [ ] Add role-based dashboard redirects
- [ ] Create role migration tools

---

## Related Files

- **RBAC Helper**: `src/lib/rbac.ts`
- **RoleGate Component**: `src/components/RoleGate.tsx`
- **Middleware**: `middleware.ts`
- **Example Protected Page**: `src/app/admin/dashboard/page.tsx`
- **Example Protected API**: `src/app/api/dashboard/summary/route.ts`

---

## Quick Reference Card

### Server-Side Protection

```typescript
import { requireOwnerOrCoach } from '@/lib/rbac'

const check = requireOwnerOrCoach()
if (!check.ok) return <div>Unauthorized</div>
```

### Client-Side UI Gating

```tsx
import { RoleGate } from '@/components/RoleGate'

<RoleGate allow={['owner', 'coach']}>
  <button>Admin Button</button>
</RoleGate>
```

### Set Role in Clerk

```
Dashboard → Users → Select User → Public Metadata
{ "role": "owner" }
```

---

**You're all set!** Focus on building your RBAC features. The authentication and role checking is handled. 🚀
