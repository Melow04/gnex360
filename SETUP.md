# GNEX 360 Setup Guide

Complete step-by-step guide to set up and run GNEX 360 on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** (optional, for version control)
- **A code editor** (VS Code recommended)

## Step 1: Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com) and sign up
2. Create a new application
3. In the dashboard, go to **API Keys**
4. Copy your:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

Keep these keys handy for Step 4.

## Step 2: Install Dependencies

Open a terminal in the `gnex360` folder and run:

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- Clerk for authentication
- Prisma for database ORM
- shadcn/ui components
- QR code libraries
- Utility libraries

## Step 3: Start PostgreSQL Database

Run the following Docker command to start a PostgreSQL container:

```bash
docker run --name gnex-db \
  -e POSTGRES_USER=gnex \
  -e POSTGRES_PASSWORD=gnex \
  -e POSTGRES_DB=gnex360 \
  -p 5432:5432 -d postgres:17
```

**Verify it's running:**
```bash
docker ps
```

You should see `gnex-db` in the list.

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your code editor

3. Update the Clerk keys you copied in Step 1:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
   QR_TOKEN_SECRET=your-long-random-secret
   ```

4. The `DATABASE_URL` should already be correct:
   ```env
   DATABASE_URL="postgresql://gnex:gnex@localhost:5432/gnex360"
   ```

## Step 5: Set Up the Database

Run Prisma migrations to create all database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables (User, Plan, Membership, Payment, EntryLog)
- Set up relationships
- Generate Prisma Client

## Step 6: Seed the Database

Populate the database with default membership plans:

```bash
npx prisma db seed
```

This creates three plans:
- **Monthly** (30 days) - ₱799
- **Quarterly** (90 days) - ₱1,999
- **Annual** (365 days) - ₱6,999

## Step 7: Start the Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

## Step 8: Configure Clerk Application (Important!)

Back in the Clerk dashboard:

1. **Configure URLs**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/onboarding`

2. **Allow Additional Email Addresses** (optional):
   - Go to **User & Authentication** → **Email, Phone, Username**
   - Enable email as the primary authentication method

3. **Enable Organizations** (optional for future):
   - Go to **Organization Settings**
   - You can enable this later for multi-gym support

## Step 9: Create Your First User

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **Sign Up**
3. Register with your email
4. After registration, you'll be redirected to the onboarding page

## Step 10: Register User in Database

After creating a Clerk account, you need to register the user in your database.

**Option 1: Use the API directly**

Make a POST request to `/api/users/register`:

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_XXXXX",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "OWNER"
  }'
```

Replace `user_XXXXX` with your actual Clerk user ID (found in Clerk dashboard).

**Option 2: Create an onboarding page**

The onboarding page should:
1. Fetch the current Clerk user
2. Submit their details to `/api/users/register`
3. Generate their QR code
4. Redirect to dashboard

## Step 11: Explore the Application

### For Admins (OWNER/COACH)

- **Dashboard**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
  - View active members
  - See today's entries
  - Track revenue
  - Recent payments

- **Plans**: [http://localhost:3000/admin/plans](http://localhost:3000/admin/plans)
  - View all membership plans
  - See subscription counts

### Key API Endpoints

Test these with Postman or curl:

1. **User Registration**
   ```bash
   POST /api/users/register
   ```

2. **Create Membership**
   ```bash
   POST /api/memberships
   Body: { "userId": "...", "planId": "..." }
   ```

3. **QR Code Entry**
   ```bash
   POST /api/entry/qr-token
   # member session only

   POST /api/entry/scan
   Body: { "qrToken": "<signed-short-lived-token>" }
   ```

4. **Dashboard Stats**
   ```bash
   GET /api/dashboard/summary
   ```

## Troubleshooting

### Port 5432 Already in Use

If you see an error about port 5432:

```bash
# Stop any existing PostgreSQL containers
docker stop $(docker ps -q --filter ancestor=postgres)

# Or use a different port
docker run --name gnex-db \
  -e POSTGRES_USER=gnex \
  -e POSTGRES_PASSWORD=gnex \
  -e POSTGRES_DB=gnex360 \
  -p 5433:5432 -d postgres:17

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://gnex:gnex@localhost:5433/gnex360"
```

### Clerk Keys Not Working

1. Make sure you copied the **Test** keys, not production keys
2. Verify the keys don't have any extra spaces
3. Restart the dev server after updating `.env`

### Prisma Client Errors

If you see errors about missing Prisma Client:

```bash
npx prisma generate
```

### Database Connection Errors

Verify Docker container is running:

```bash
docker ps
docker logs gnex-db
```

### TypeScript Errors in Editor

Restart your TypeScript server in VS Code:
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Type "TypeScript: Restart TS Server"

## Next Steps

1. **Customize the UI** - Modify components in `src/components/`
2. **Add More Features** - Extend the API in `src/app/api/`
3. **Create Dashboards** - Build reports and analytics
4. **Deploy** - Use Vercel, Railway, or your preferred platform

## Useful Commands

```bash
# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npx prisma studio          # Open visual database editor
npx prisma migrate dev     # Create new migration
npx prisma db push         # Push schema without migration
npx prisma db seed         # Reseed the database
npx prisma generate        # Regenerate Prisma Client

# Docker
docker start gnex-db       # Start database
docker stop gnex-db        # Stop database
docker logs gnex-db        # View logs
docker exec -it gnex-db psql -U gnex -d gnex360  # Connect to database
```

## Support

For issues and questions:
1. Check the [README.md](README.md) for general documentation
2. Review the [Prisma schema](prisma/schema.prisma) for data models
3. Check Clerk documentation at [clerk.com/docs](https://clerk.com/docs)
4. Review Next.js documentation at [nextjs.org/docs](https://nextjs.org/docs)

## Success! 🎉

You should now have a fully functional gym management system with:
- ✅ User authentication
- ✅ QR code generation and scanning
- ✅ Membership management
- ✅ Admin dashboard
- ✅ Payment tracking

Ready to build Stage 2! 🚀
