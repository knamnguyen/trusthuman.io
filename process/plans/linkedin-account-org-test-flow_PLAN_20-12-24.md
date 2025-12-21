# LinkedIn Account + Organization Test Flow

**Status:** COMPLETED
**Date:** 2024-12-20
**Related:** [multi-tenant-system-design.md](./multi-tenant-system-design.md)

---

## Goal

Simple test flow to validate org-based LinkedIn account management:

1. User adds LinkedIn account (URL only) from webapp
2. Account is linked to user's current organization
3. Webapp + Extension show current org and accessible accounts

---

## Current vs Target Schema

### Current LinkedInAccount

```prisma
model LinkedInAccount {
  id               String                @id @default(uuid())
  userId           String                // Required - links to user
  email            String                @unique // Required - LinkedIn email
  status           LinkedInAccountStatus // ACTIVE | CONNECTING | SUSPENDED
  browserProfileId String                // Required - Hyperbrowser profile
  location         String                // Required
  name             String?
  // ... other fields
}
```

### Target LinkedInAccount (from design)

```prisma
model LinkedInAccount {
  id               String   @id @default(uuid())
  organizationId   String?  // NEW - nullable, links to org
  profileUrl       String   // NEW - input LinkedIn URL
  profileSlug      String   // NEW - extracted from URL (e.g., "john-doe-123")
  status           String?  // CHANGED - null | "registered" | "connected"
  urn              String?  // NEW - set on Hyperbrowser connect
  browserProfileId String?  // CHANGED - nullable
  registeredAt     DateTime?
  connectedAt      DateTime?
  // ... keep existing fields for backwards compat during migration
}
```

---

## Minimal Test Flow Implementation

### Phase 1: Schema Changes

Add new fields to LinkedInAccount (keep existing for backwards compat):

```prisma
model LinkedInAccount {
  // Existing fields (keep for now)
  id               String                @id @default(uuid())
  userId           String
  email            String                @unique
  status           LinkedInAccountStatus
  browserProfileId String
  location         String
  name             String?
  // ... etc

  // NEW fields for org-based flow
  organizationId   String?
  profileUrl       String?
  profileSlug      String?
  registrationStatus String? // "registered" | "connected" | null

  org Organization? @relation(fields: [organizationId], references: [id])
}

model Organization {
  // ... existing
  linkedInAccounts LinkedInAccount[]
}
```

### Phase 2: API Endpoint

**New tRPC route:** `linkedInAccount.registerByUrl`

```typescript
// packages/api/src/router/linkedin-account.ts

registerByUrl: protectedProcedure
  .input(z.object({
    profileUrl: z.string().url(),
    organizationId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Validate user is member of org
    const membership = await ctx.db.organizationMember.findUnique({
      where: { orgId_userId: { orgId: input.organizationId, userId: ctx.user.id } }
    });
    if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });

    // 2. Extract profileSlug from URL
    const profileSlug = extractProfileSlug(input.profileUrl);

    // 3. Check if already registered in another org
    const existing = await ctx.db.linkedInAccount.findFirst({
      where: {
        profileSlug,
        organizationId: { not: null },
        organizationId: { not: input.organizationId }
      }
    });
    if (existing) throw new TRPCError({
      code: 'CONFLICT',
      message: 'This LinkedIn is registered in another workspace'
    });

    // 4. Create or update account
    return ctx.db.linkedInAccount.upsert({
      where: { profileSlug }, // need unique index
      create: {
        profileUrl: input.profileUrl,
        profileSlug,
        organizationId: input.organizationId,
        registrationStatus: 'registered',
        // Fill required legacy fields with placeholders
        userId: ctx.user.id,
        email: `${profileSlug}@placeholder.linkedin`,
        status: 'CONNECTING',
        browserProfileId: 'pending',
        location: 'unknown',
      },
      update: {
        organizationId: input.organizationId,
        registrationStatus: 'registered',
      }
    });
  }),
```

**Query route:** `linkedInAccount.listByOrg`

```typescript
listByOrg: protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Validate membership
    const membership = await ctx.db.organizationMember.findUnique({
      where: { orgId_userId: { orgId: input.organizationId, userId: ctx.user.id } }
    });
    if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });

    return ctx.db.linkedInAccount.findMany({
      where: { organizationId: input.organizationId },
      select: {
        id: true,
        profileUrl: true,
        profileSlug: true,
        registrationStatus: true,
        name: true,
        createdAt: true,
      }
    });
  }),
```

### Phase 3: Webapp UI

**Location:** `apps/nextjs/src/app/(dashboard)/settings/accounts/page.tsx` (or similar)

Simple UI:
1. Show current organization name
2. List LinkedIn accounts in org
3. "Add Account" button → opens modal with URL input
4. Submit → calls `registerByUrl` mutation

```tsx
// Simplified component structure
function AccountsPage() {
  const { data: org } = trpc.organization.getCurrent.useQuery();
  const { data: accounts } = trpc.linkedInAccount.listByOrg.useQuery({
    organizationId: org?.id
  });
  const registerMutation = trpc.linkedInAccount.registerByUrl.useMutation();

  return (
    <div>
      <h1>Organization: {org?.name}</h1>

      <h2>LinkedIn Accounts</h2>
      <ul>
        {accounts?.map(acc => (
          <li key={acc.id}>
            {acc.profileSlug} - {acc.registrationStatus}
          </li>
        ))}
      </ul>

      <AddAccountForm onSubmit={(url) => {
        registerMutation.mutate({ profileUrl: url, organizationId: org.id });
      }} />
    </div>
  );
}
```

### Phase 4: Extension UI

**Location:** `apps/wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

Show in sidebar:
1. Current organization name (from user's active org)
2. List of LinkedIn accounts user can access
3. Highlight if current LinkedIn page matches one of the accounts

```tsx
// Add to existing sidebar
function OrgAccountsSection() {
  const { data: org } = trpc.organization.getCurrent.useQuery();
  const { data: accounts } = trpc.linkedInAccount.listByOrg.useQuery({
    organizationId: org?.id
  });

  return (
    <div className="org-accounts">
      <span className="org-name">{org?.name}</span>
      <span className="account-count">{accounts?.length || 0} accounts</span>
    </div>
  );
}
```

---

## Helper Function

```typescript
// packages/api/src/utils/linkedin.ts

export function extractProfileSlug(url: string): string {
  // Handle various LinkedIn URL formats:
  // https://www.linkedin.com/in/john-doe-123/
  // https://linkedin.com/in/john-doe-123
  // https://www.linkedin.com/in/john-doe-123?someParam=value

  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  if (!match) throw new Error('Invalid LinkedIn profile URL');
  return match[1];
}
```

---

## API: Get Current Organization

Need a way to get user's "current" organization:

```typescript
// packages/api/src/router/organization.ts

getCurrent: protectedProcedure.query(async ({ ctx }) => {
  // For now: return first org user is member of
  // Later: could store "activeOrgId" in user preferences
  const membership = await ctx.db.organizationMember.findFirst({
    where: { userId: ctx.user.id },
    include: { org: true },
    orderBy: { joinedAt: 'asc' }, // Oldest = their personal org
  });

  return membership?.org ?? null;
}),
```

---

## Implementation Order

1. **Schema** - Add new fields to LinkedInAccount, add relation to Organization
2. **DB Push** - Apply schema changes
3. **API Routes** - Create `linkedInAccount.registerByUrl`, `listByOrg`, `organization.getCurrent`
4. **Webapp UI** - Simple accounts page with add form
5. **Extension UI** - Show org + accounts in sidebar

---

## Questions to Clarify

1. **Unique constraint**: Should `profileSlug` be unique globally, or only within active orgs?
   - Design says: one LinkedIn = one org at a time
   - So: `@@unique([profileSlug])` where `organizationId IS NOT NULL`

2. **Current org selection**: For users in multiple orgs, how do they switch?
   - Option A: Always use first/personal org
   - Option B: Add org switcher UI (more work)
   - **Recommendation**: Start with Option A for test flow

3. **Legacy accounts**: What happens to existing LinkedInAccounts (pre-org)?
   - Leave them with `organizationId: null` for now
   - Migration script later to assign them to user's personal org

---

## Success Criteria

- [ ] Can add LinkedIn URL from webapp
- [ ] Account appears in org's account list
- [ ] Extension shows org name + account count
- [ ] Cannot add same LinkedIn to two orgs (blocking works)
