# API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Authentication

Most endpoints require authentication via Clerk. Include the session token in requests.

Public endpoints:
- None

---

## Endpoints

### Users

#### Register New User
```http
POST /api/users/register
```

**Request Body:**
```json
{
  "clerkId": "user_2XXX...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "CLIENT"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "user": {
    "id": "clxxx...",
    "qrCode": "GNEX-uuid...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "CLIENT"
  }
}
```

**Roles:** `OWNER`, `COACH`, `CLIENT`, `DEV`

---

#### Update User Status
```http
PATCH /api/users/:id/status
```

**Auth Required:** OWNER only

**Request Body:**
```json
{
  "status": "BANNED"
}
```

**Status Values:** `ACTIVE`, `INACTIVE`, `BANNED`

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "clxxx...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "status": "BANNED"
  }
}
```

---

### Memberships

#### Create Membership
```http
POST /api/memberships
```

**Auth Required:** OWNER or COACH

**Request Body:**
```json
{
  "userId": "clxxx...",
  "planId": "clxxx..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "membership": {
    "id": "clxxx...",
    "user": {
      "id": "clxxx...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "plan": {
      "id": "clxxx...",
      "name": "Monthly",
      "durationDays": 30,
      "price": "799.00"
    },
    "startDate": "2026-02-25T00:00:00.000Z",
    "endDate": "2026-03-27T00:00:00.000Z",
    "membershipFee": "500.00",
    "status": "ACTIVE"
  }
}
```

**Notes:**
- User must not have an existing membership
- Membership fee is fixed at ₱500
- End date is automatically calculated based on plan duration

---

### Entry Management

#### Generate Member Entry QR Token
```http
POST /api/entry/qr-token
```

**Auth Required:** CLIENT (member)

**Request Body:** none

**Success Response:** `200 OK`
```json
{
  "success": true,
  "qrToken": "<signed-token>",
  "expiresAt": "2026-02-26T10:30:30.000Z",
  "ttlSeconds": 30,
  "member": {
    "name": "John Doe",
    "plan": "Monthly"
  }
}
```

**Notes:**
- Token is short-lived (30s)
- Token is one-time use; replay attempts are rejected
- Only your backend can validate token signatures

---

#### QR Code Entry Scan
```http
POST /api/entry/scan
```

**Auth Required:** OWNER or COACH (scanner operator)

**Request Body:**
```json
{
  "qrToken": "<signed-token>"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Entry granted",
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "membershipPlan": "Monthly",
    "expiryDate": "2026-03-27T00:00:00.000Z"
  },
  "entryTime": "2026-02-25T10:30:00.000Z"
}
```

**Error Responses:**

**User Not Found** - `404 Not Found`
```json
{
  "success": false,
  "error": "Invalid or expired QR token",
  "reason": "USER_NOT_FOUND"
}
```

**User Banned/Inactive** - `403 Forbidden`
```json
{
  "success": false,
  "error": "Access denied",
  "reason": "USER_BANNED",
  "userName": "John Doe"
}
```

**No Membership** - `403 Forbidden`
```json
{
  "success": false,
  "error": "No active membership",
  "reason": "NO_MEMBERSHIP",
  "userName": "John Doe"
}
```

**Membership Expired** - `403 Forbidden`
```json
{
  "success": false,
  "error": "Membership expired or suspended",
  "reason": "MEMBERSHIP_EXPIRED",
  "userName": "John Doe",
  "expiryDate": "2026-01-15T00:00:00.000Z"
}
```

---

### Dashboard

#### Get Dashboard Summary
```http
GET /api/dashboard/summary
```

**Auth Required:** OWNER or COACH

**Response:** `200 OK`
```json
{
  "success": true,
  "stats": {
    "totalActiveMembers": 42,
    "todayEntries": 18,
    "activeSubscriptions": 38,
    "totalRevenue": 125000
  },
  "recentPayments": [
    {
      "id": "clxxx...",
      "amount": "799.00",
      "paidAt": "2026-02-24T14:30:00.000Z",
      "method": "CASH",
      "note": null,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "plan": "Monthly"
    }
  ]
}
```

**Stats Breakdown:**
- `totalActiveMembers` - Count of ACTIVE users with CLIENT role
- `todayEntries` - Entry logs from today (since 00:00)
- `activeSubscriptions` - Memberships with ACTIVE status and future end date
- `totalRevenue` - Sum of all payment amounts
- `recentPayments` - Last 10 payments, sorted by date descending

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
Clerk authentication failed. User not logged in.

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```
User doesn't have required role for this operation.

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "User already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

---

## Role-Based Access Control

| Endpoint | OWNER | COACH | CLIENT |
|----------|-------|-------|--------|
| POST /api/users/register | ✅ | ✅ | ✅ |
| PATCH /api/users/:id/status | ✅ | ❌ | ❌ |
| POST /api/memberships | ✅ | ✅ | ❌ |
| GET /api/dashboard/summary | ✅ | ✅ | ❌ |
| POST /api/entry/qr-token | ❌ | ❌ | ✅ |
| POST /api/entry/scan | ✅ | ✅ | ❌ |

---

## Testing with curl

### Register a user
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_2XXX",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "CLIENT"
  }'
```

### Scan QR code
```bash
curl -X POST http://localhost:3000/api/entry/scan \
  -H "Authorization: Bearer OWNER_OR_COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrToken": "SIGNED_TOKEN_HERE"
  }'
```

### Get dashboard (requires auth token)
```bash
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN"
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:
- QR scan endpoint: 10 requests per minute per IP
- User registration: 5 requests per hour per IP
- Dashboard: 60 requests per minute per user

---

## RBAC Metadata (Current Approach)

Role-based access control is driven by Clerk public metadata.

- Set role in Clerk Dashboard → Users → Public metadata
- Example payload: `{ "role": "owner" }`
- Allowed roles: `owner`, `dev`, `coach`, `client`, `visitor`
- Server routes must validate roles via `requireRole` helpers in `src/lib/rbac.ts`
