# Organization Webhook Sync Implementation

**Status:** COMPLETED
**Date:** 2024-12-20
**Related:** [multi-tenant-system-design.md](./multi-tenant-system-design.md)

---

## Overview

Implemented Clerk webhook handlers to sync Organization and OrganizationMember data between Clerk and our database. This is the foundation for the multi-tenant system.

---

## Schema Changes

### New Models Added

**File:** `packages/db/prisma/schema.prisma`

```prisma
model Organization {
  id               String   @id // Clerk organization ID
  name             String
  stripeCustomerId String?  @unique
  purchasedSlots   Int      @default(1)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  members OrganizationMember[]
}

model OrganizationMember {
  id       String   @id @default(uuid())
  orgId    String
  userId   String
  role     String // "admin" | "member"
  joinedAt DateTime @default(now())

  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([orgId, userId])
  @@index([userId])
}
```

### User Model Updated

Added relation to OrganizationMember:
```prisma
model User {
  // ... existing fields
  organizationMemberships OrganizationMember[]
}
```

---

## Webhook Handlers

**File:** `apps/nextjs/src/app/api/webhooks/clerk/route.ts`

### Events Handled

| Event | Action | Notes |
|-------|--------|-------|
| `organization.created` | `db.organization.create()` | Syncs id, name |
| `organization.updated` | `db.organization.update()` | Updates name |
| `organization.deleted` | `db.organization.deleteMany()` | Graceful delete, cascades members |
| `organizationMembership.created` | `db.organizationMember.upsert()` | Normalizes role |
| `organizationMembership.updated` | `db.organizationMember.update()` | Updates role |
| `organizationMembership.deleted` | `db.organizationMember.deleteMany()` | Graceful delete |

### Role Normalization

Clerk roles are normalized to simplified roles:
- `org:admin` → `"admin"`
- `org:member` (or any other) → `"member"`

### Graceful Deletes

All delete operations use `deleteMany` instead of `delete` to handle cases where:
- Records were created before webhook sync was set up
- Records were manually deleted
- Webhook events arrive out of order

Instead of erroring, missing records log a warning:
```
⚠️ Membership not found in database (already deleted or never synced): user_xxx -> org_xxx
```

---

## Clerk Dashboard Setup

### Webhook Events to Enable

In Clerk Dashboard → Webhooks, subscribe to:

- [x] `organization.created`
- [x] `organization.updated`
- [x] `organization.deleted`
- [x] `organizationMembership.created`
- [x] `organizationMembership.updated`
- [x] `organizationMembership.deleted`

### Existing Events (already configured)

- [x] `user.created`
- [x] `user.updated`
- [x] `user.deleted`

---

## Design Decisions

### Why no `createdByUserId` on Organization?

- Membership table already tracks roles
- Admin is the first user with `role: "admin"`
- Simpler schema, less redundancy

### Why cache membership locally?

- Faster queries at scale (no Clerk API calls)
- Can join with other tables easily
- Supports offline/degraded mode

### Why `deleteMany` instead of `delete`?

- Idempotent operations
- Handles out-of-order webhook delivery
- No errors for records created before sync was set up

---

## Migration Notes

### Existing Users

Current users have no Organization or OrganizationMember records. Future migration will:

1. Create personal org for each user via Clerk Backend API
2. Clerk webhooks will automatically sync to our DB
3. No manual DB migration needed

### Testing

1. Create a new user in Clerk
2. User webhook creates User record
3. If org auto-creation is enabled, org webhooks create Organization + OrganizationMember records
4. Verify in database:
   ```sql
   SELECT * FROM "Organization";
   SELECT * FROM "OrganizationMember";
   ```

---

## Files Changed

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Added Organization, OrganizationMember models |
| `apps/nextjs/src/app/api/webhooks/clerk/route.ts` | Added org + membership event handlers |

---

## Next Steps

See [multi-tenant-system-design.md](./multi-tenant-system-design.md) for:

1. Auto-create personal org on user signup
2. Link LinkedInAccount to Organization
3. Update API layer to use orgId context
4. Stripe integration for org billing
