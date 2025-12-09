# Profile Trip Filtering Research

## Problem Statement
When loading a user's public profile via the API endpoint `/api/profile/{username}`, the API was returning ALL trips regardless of:
1. Whether the trip is active (`isActive` status)
2. Whether the deadline has passed (past dates showing up)

**Expected Behavior:**
- Only show active trips (isActive: true)
- Only show trips with deadline today or in the future
- Past/inactive trips should not appear

## Current Implementation
File: `/app/backend/src/services/auth.service.ts`
Method: `getPublicProfile(slug: string)`

The trips query was:
```typescript
const trips = await this.db.trip.findMany({
  where: { jastiperId: user.id },
  orderBy: { createdAt: 'desc' },
  select: { ... },
})
```

This fetches ALL trips without any filtering on status or deadline.

## Database Schema Analysis
From `/app/backend/prisma/schema.prisma`:
- Trip model has:
  - `isActive: Boolean @default(false)` - Trip status flag
  - `deadline: DateTime?` - Trip deadline (nullable)

## Solution Direction
Apply WHERE clause filters to:
1. Filter by `isActive: true` - Only get active trips
2. Filter by `deadline >= today` - Only get trips with future or today's deadline

Need to compare dates at the start of the day (00:00:00) to include all trips with today's deadline.
