# Clerk Webhook Setup Guide

This guide explains how to configure Clerk webhooks to automatically sync user data to your Prisma database.

## What Does This Do?

When enabled, Clerk webhooks automatically:
- ✅ Create a user in your database when someone signs up
- ✅ Generate a QR code for new users
- ✅ Update user data when they change their profile
- ✅ Delete user data when they delete their account

**No more manual user registration!**

## Setup Steps

### 1. Start Your Development Server

Make sure your app is running:

```bash
npm run dev
```

Your webhook endpoint will be at: `http://localhost:3000/api/webhooks/clerk`

### 2. Expose Your Local Server (For Testing)

Clerk needs a public URL to send webhooks. Use ngrok:

```bash
# Install ngrok (if you haven't)
# Download from: https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

### 3. Configure Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the left sidebar
4. Click **Add Endpoint**

**Configure the endpoint:**
- **Endpoint URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
- **Subscribe to events**:
  - ✅ `user.created`
  - ✅ `user.updated`
  - ✅ `user.deleted`
- Click **Create**

### 4. Get Your Webhook Signing Secret

After creating the webhook:
1. Click on your new webhook endpoint
2. Find the **Signing Secret** (starts with `whsec_...`)
3. Click to reveal and copy it

### 5. Add Signing Secret to .env

Open your `.env` file and update:

```env
CLERK_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

Replace `whsec_YOUR_ACTUAL_SECRET_HERE` with your actual secret.

### 6. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## Testing the Webhook

### Test User Creation

1. Go to `http://localhost:3000/sign-up`
2. Register a new user
3. Check your terminal - you should see: `✅ Created user: email@example.com`
4. Verify in database:
   ```bash
   npx prisma studio
   ```
   Open the User table and see the new user!

### Test with Clerk Dashboard

You can also send test webhook events:
1. In Clerk Dashboard → Webhooks → Your Endpoint
2. Click **Testing** tab
3. Click **Send Example** for `user.created`
4. Check your terminal for the log

## Production Setup

For production (Vercel, Railway, etc.):

1. **Get your production URL**: `https://yourdomain.com`
2. **Update webhook URL in Clerk**: `https://yourdomain.com/api/webhooks/clerk`
3. **Add signing secret to production env vars**
4. **No ngrok needed!**

## Webhook Events Handled

| Event | Action | Details |
|-------|--------|---------|
| `user.created` | Creates user in DB | Auto-generates QR code, sets role to CLIENT |
| `user.updated` | Updates user in DB | Syncs name, email, phone changes |
| `user.deleted` | Deletes user from DB | Removes user and related data |

## Default User Settings

New users are created with:
- **Role**: `CLIENT` (you can manually change to OWNER/COACH later)
- **Status**: `ACTIVE`
- **QR Code**: Automatically generated (`GNEX-{uuid}`)

## Changing User Roles

After a user is auto-created, you can upgrade them to admin:

**Option 1: Prisma Studio**
```bash
npx prisma studio
```
1. Go to User table
2. Find the user
3. Change `role` to `OWNER`

**Option 2: Direct SQL**
```bash
docker exec -it gnex-db psql -U gnex -d gnex360
```
```sql
UPDATE "User" SET role = 'OWNER' WHERE email = 'admin@example.com';
\q
```

## Troubleshooting

### Webhook Returns 400/500 Error

**Check:**
1. Is `CLERK_WEBHOOK_SECRET` in your `.env`?
2. Did you restart the server after adding it?
3. Is the secret correct (starts with `whsec_`)?

**Verify webhook secret:**
```bash
# Windows PowerShell
echo $env:CLERK_WEBHOOK_SECRET

# Should output: whsec_...
```

### User Not Created

**Check terminal logs:**
- Look for `✅ Created user: ...` message
- Any error messages?

**Check database:**
```bash
npx prisma studio
```
Open User table and verify

**Check Clerk webhook logs:**
1. Clerk Dashboard → Webhooks → Your Endpoint
2. Click **Logs** tab
3. See if webhook was sent and response code

### ngrok Session Expired

Free ngrok URLs expire. When they do:
1. Restart ngrok → get new URL
2. Update Clerk webhook endpoint URL
3. No need to change signing secret

### Duplicate User Error

If you manually created a user before webhooks, they might conflict:
1. Delete the manual user from Prisma Studio, or
2. The webhook will skip them (shows "User already exists" log)

## Security Notes

1. **Webhook endpoint is public** - This is required for Clerk to call it
2. **Signature verification** - We verify every webhook using Svix
3. **Invalid signatures are rejected** - No unauthorized access
4. **Keep your signing secret safe** - Never commit to git

## Monitoring

Watch your terminal when users sign up:
```
✅ Created user: john@example.com (clr_abc123)
✅ Updated user: jane@example.com
✅ Deleted user: old@example.com
```

## Next Steps

Now that webhooks are set up:
1. **Test the flow**: Sign up → Check database → See QR code
2. **Develop RBAC**: Focus on role-based features
3. **No more manual registration needed!**

## Related Files

- **Webhook endpoint**: `src/app/api/webhooks/clerk/route.ts`
- **Middleware**: `middleware.ts` (excludes webhook from auth)
- **Environment**: `.env` (webhook secret)
- **Prisma client**: `src/lib/prisma.ts`

---

**Questions?** Check the webhook logs in Clerk Dashboard or your terminal output.
