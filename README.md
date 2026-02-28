# GNEX 360 - Gym Management System

Stage 1 of GNEX 360: The core operational layer featuring Identity & Access, Membership & Subscription, and Admin Dashboard.

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[RBAC Guide](RBAC-GUIDE.md)** - Role-based access control implementation
- **[API Documentation](API.md)** - API endpoints and usage

## Features

### ✅ Phase 0 — Project Scaffolding
- Next.js 15+ with TypeScript, Tailwind CSS, and App Router
- shadcn/ui component library
- PostgreSQL database with Docker
- Environment configuration

### ✅ Phase 1 — Database Schema
- User management with roles (OWNER, COACH, CLIENT, DEV)
- Membership plans and subscriptions
- Payment tracking
- Entry logging system

### ✅ Phase 2 — Auth & RBAC
- Clerk authentication integration
- Role-based access control (owner, dev, coach, client, visitor)
- Protected routes and API endpoints
- Manual role assignment via Clerk metadata
- Server-side and client-side role checks
- 📖 **[Complete RBAC Guide](RBAC-GUIDE.md)**

### ✅ Phase 3 — Identity & QR Core
- User registration with QR code generation
- QR code display component
- Entry scan endpoint with validation
- User status management (Active, Inactive, Banned)

### ✅ Phase 4 — Membership & Subscription
- Subscription creation with plan selection
- Automatic expiry calculation
- Membership validation
- ₱500 fixed membership fee

### ✅ Phase 5 — Admin Dashboard
- Real-time statistics
  - Active member count
  - Today's entries
  - Active subscriptions
  - Total revenue
- Recent payments table
- Plans overview page

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Docker installed (for PostgreSQL)
- Clerk account for authentication

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from Clerk dashboard
   - `CLERK_SECRET_KEY` - Get from Clerk dashboard
   - `QR_TOKEN_SECRET` - Random long secret for signing short-lived QR tokens

3. **Start PostgreSQL with Docker**
   ```bash
   docker run --name gnex-db -e POSTGRES_USER=gnex -e POSTGRES_PASSWORD=gnex -e POSTGRES_DB=gnex360 -p 5432:5432 -d postgres:17
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the database**
   ```bash
   npx prisma db seed
   ```
   
   This creates three default plans:
   - Monthly (30 days) - ₱799
   - Quarterly (90 days) - ₱1,999
   - Annual (365 days) - ₱6,999

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/         # Admin dashboard with stats
│   │   └── plans/             # Membership plans page
│   ├── api/
│   │   ├── dashboard/
│   │   │   └── summary/       # Dashboard data API
│   │   ├── entry/
│   │   │   └── scan/          # QR code entry validation
│   │   ├── memberships/       # Membership creation
│   │   └── users/
│   │       ├── register/      # User registration
│   │       └── [id]/status/   # User status management
│   ├── sign-in/               # Clerk sign-in page
│   ├── sign-up/               # Clerk sign-up page
│   └── page.tsx               # Home page
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── DashboardClient.tsx    # Dashboard UI component
│   └── QRDisplay.tsx          # QR code display component
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── rbac.ts                # Role-based access control
│   └── membership.ts          # Membership validation helpers
└── middleware.ts              # Route protection middleware

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Database seeding script
```

## API Endpoints

### Protected Routes (Authentication Required)
- `POST /api/entry/qr-token` - Generate a short-lived signed member QR token
- `POST /api/entry/scan` - Validate signed QR token and log entry (OWNER/COACH scanner)
- `POST /api/users/register` - Register new user with QR code
- `POST /api/memberships` - Create membership (OWNER/COACH only)
- `GET /api/dashboard/summary` - Get dashboard statistics (OWNER/COACH only)
- `PATCH /api/users/[id]/status` - Update user status (OWNER only)

## Database Models

### User
- Stores user information, role, and QR code
- Linked to Clerk authentication
- Can be ACTIVE, INACTIVE, or BANNED

### Plan
- Predefined subscription templates
- Fixed pricing and duration

### Membership
- Links users to plans
- Tracks start/end dates and status
- Includes ₱500 membership fee

### Payment
- Records all payments
- Linked to memberships
- Tracks payment method and notes

### EntryLog
- Records gym entry events
- Timestamps and method (QR)

## User Roles

- **OWNER** - Full access to all features
- **COACH** - Can manage memberships and view dashboard
- **CLIENT** - Regular gym member
- **DEV** - Development/testing role

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **Database**: PostgreSQL 17
- **ORM**: Prisma
- **QR Codes**: react-qr-code, qrcode
- **Date Utils**: date-fns
- **State Management**: zustand

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Prisma commands
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Create and apply migrations
npx prisma db seed         # Seed the database
```

## Docker Commands

```bash
# Start PostgreSQL
docker start gnex-db

# Stop PostgreSQL
docker stop gnex-db

# View logs
docker logs gnex-db

# Connect to database
docker exec -it gnex-db psql -U gnex -d gnex360
```

## Next Steps (Future Stages)

Stage 1 provides the foundation. Future enhancements:
- [ ] Payment gateway integration (Xendit)
- [ ] ML-based attendance predictions
- [ ] Class scheduling system
- [ ] Mobile app for members
- [ ] Advanced analytics and reporting

## License

MIT
