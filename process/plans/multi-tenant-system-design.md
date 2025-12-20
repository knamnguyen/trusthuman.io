# EngageKit Multi-Tenant System Design

## Overview

Multi-tenant architecture for EngageKit supporting free and paid organizations, multiple LinkedIn accounts, and team collaboration.

**Design Principles:**

- Simplicity and quick to implement but with future extensibility in mind
- Org = billing + access wrapper only
- LinkedInAccount = owns all functional data
- No user-level tiers, only org-level tiers
- Every user belongs to exactly one org (auto-created on signup, cannot create more)
- No audit trail - data belongs to accounts, not users
- Any org member can manage any account in the org

**MVP Simplifications:**

- Users cannot delete their organization
- Users cannot create additional organizations (1 org per user, auto-created)
- Users can still be invited to OTHER orgs as members
- Org deletion is not supported (future feature)

---

## Core Entities

| Entity               | Description                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **User**             | EngageKit account (Clerk auth). Belongs to 1+ orgs.                                                       |
| **Organization**     | Billing entity. Manages member access to LinkedIn accounts.                                               |
| **LinkedIn Account** | LinkedIn profile. Owns all data (personas, history, settings). Can exist without org (cached/unassigned). |

---

## User Signup Flow

```
User signs up via Clerk
→ Auto-create personal org: "{User}'s Workspace"
→ User is admin of their org
→ Org has 1 free slot, no Stripe subscription
→ User can now:
  - Register a LinkedIn URL in their free org
  - Join other orgs via invite (paid orgs)
→ User CANNOT:
  - Create additional organizations
  - Delete their organization
```

**Every user has exactly one org they own (their default free org). They can be members of other orgs.**

---

## Data Ownership

```
Organization (minimal - billing + access only)
├── stripeCustomerId
├── purchasedSlots
└── manages member access to → LinkedInAccounts[]

LinkedInAccount (owns everything)
├── organizationId (nullable - can be unassigned)
├── Personas[]
├── TargetLists[]
├── Settings{}
├── CommentHistory[]
└── (future: PostHistory[], ScheduledPosts[], etc.)
```

**Reasoning:**

- Each LinkedIn account = self-contained unit
- AI personalization per account, not per org
- If LinkedIn transfers to new org, all data stays together
- Org deletion doesn't delete data (just removes association)
- Simpler queries: `WHERE linkedInAccountId = ?`

---

## Organization Tiers

|                     | Free Org        | Paid Org        |
| ------------------- | --------------- | --------------- |
| Members             | 1 (solo, admin) | Unlimited       |
| Slots               | 1               | 1+              |
| Can invite          | No              | Yes             |
| Hyperbrowser        | No              | Yes             |
| Chrome Extension    | Yes             | Yes             |
| Scheduling          | No              | Yes             |
| Comments/day        | 10 per account  | 100 per account |
| Stripe subscription | No              | Yes             |

**Reasoning:**

- Free = 1 member = not MAO = $0 Clerk cost
- Teammates = paid feature (upgrade incentive)
- Tier derived from `stripeCustomerId` presence
- Free users get full features, just rate-limited

---

## LinkedIn Account Status

| Status     | Meaning                                  | Extension? | Hyperbrowser? | Scheduling? |
| ---------- | ---------------------------------------- | ---------- | ------------- | ----------- |
| null       | Cached/unassigned, no org owns it        | No         | No            | No          |
| registered | URL input, org owns it                   | Yes        | No            | No          |
| connected  | Hyperbrowser verified, session persisted | Yes        | Yes           | Yes         |

**Reasoning:**

- `null` = LinkedIn data exists but no org association (cache, or after disconnect)
- `registered` = Extension works immediately, no scheduling
- `connected` = Full features including scheduling
- One LinkedIn can only be registered/connected to ONE org at a time (blocking enforced)

---

## Data Schema

### User (Clerk-synced)

```
User
├── id (clerkUserId)
├── email
├── name
```

### Organization (Clerk-managed)

```
Organization
├── id (clerkOrgId)
├── name
├── createdByUserId (admin, billing contact)
├── privateMetadata:
│   ├── stripeCustomerId (null if free)
│   └── purchasedSlots (1 if free, 1+ if paid)
```

### LinkedIn Account

```
LinkedInAccount
├── id
├── organizationId (nullable - null if unassigned/cached)
├── status: null | "registered" | "connected"
├── profileSlug (from URL)
├── profileUrl
├── urn (nullable - only set if connected via Hyperbrowser)
├── browserProfileId (Hyperbrowser persistent profile)
├── registeredAt (nullable)
├── connectedAt (nullable)
```

**Note:** No `registeredByUserId` or `connectedByUserId` - simplified model with no audit trail.

### LinkedInProfile (Apify-populated cache)

```
LinkedInProfile
├── id
├── urn (unique - global identifier)
├── linkedinUrl
├── fullName
├── headline
├── profilePic
├── firstName, lastName
├── jobTitle, companyName
├── about
├── ... (rich profile data from Apify)
├── createdAt
├── updatedAt
```

**Relationship:** `LinkedInAccount.profileUrn` → `LinkedInProfile.urn`

**Reasoning:**

- Apify validates URL exists and scrapes profile data on registration
- LinkedInProfile is a shared cache (same person across orgs over time)
- LinkedInAccount references LinkedInProfile via URN
- Profile data shown in dashboard comes from LinkedInProfile

### LinkedIn Account Data (owned by LinkedIn Account)

```
CommentStyle (Persona)
├── id
├── linkedInAccountId
├── name
├── prompt
├── createdAt

TargetList
├── id
├── linkedInAccountId
├── name
├── createdAt

TargetListMembership (many-to-many join)
├── id
├── listId
├── profileUrn
├── createdAt

BlacklistedProfile
├── id
├── linkedInAccountId
├── profileUrn
├── createdAt

AutoCommentConfig (settings)
├── linkedInAccountId (PK)
├── scrollDuration
├── commentDelay
├── maxPosts
├── ... (all config fields)

AccountComment (history)
├── id
├── linkedInAccountId
├── urn
├── comment
├── commentedAt
├── ... (metadata fields)

AutoCommentRun
├── id
├── linkedInAccountId
├── status
├── startedAt
├── endedAt

BrowserInstance (operational state)
├── id
├── linkedInAccountId
├── hyperbrowserSessionId
├── status
```

**Reasoning:**

- No `*ByUserId` fields - data belongs to account, not users
- CommentHistory includes post context (can derive interaction history)
- Action-focused data model (future: PostHistory, MessageHistory)
- All data tied to LinkedInAccount, survives org changes
- BrowserInstance is for crash recovery, not audit

---

## Permissions Matrix

| Action                          | Free Admin | Paid Admin | Paid Member |
| ------------------------------- | ---------- | ---------- | ----------- |
| Register LinkedIn (URL)         | Yes        | Yes        | Yes         |
| Connect LinkedIn (Hyperbrowser) | No         | Yes        | Yes         |
| Disconnect ANY LinkedIn         | Yes        | Yes        | Yes         |
| Invite teammates                | No         | Yes        | No          |
| Remove teammates                | N/A        | Yes        | No          |
| Manage billing                  | N/A        | Yes        | No          |
| Use Chrome Extension            | Yes        | Yes        | Yes         |
| Schedule posts                  | No         | Yes        | Yes         |
| Create personas/target lists    | Yes        | Yes        | Yes         |
| Duplicate data between accounts | Yes        | Yes        | Yes         |
| View dashboard                  | Yes        | Yes        | Yes         |

**Reasoning:**

- Clerk default: only admin can invite/remove (no custom roles needed)
- **Any member can manage ANY LinkedIn account in the org** (simplified - no ownership tracking)
- Free admin has no teammates to manage
- No fine-grained permissions for MVP

---

## Pricing

| Plan    | Price           |
| ------- | --------------- |
| Monthly | $24.99 per slot |
| Yearly  | $249 per slot   |

- Simple quantity multiplication (no tiered discounts)
- Free org = 1 slot included, no payment
- Upgrade = attach Stripe subscription to existing org

---

## Scenario Flows

### Scenario 1: Free Solo User

```
User signs up
→ Org auto-created (admin: user, 1 free slot)
→ User enters LinkedIn URL
→ Extract profileSlug from URL
→ LinkedInAccount created:
  - organizationId = user's org
  - status = "registered"
→ User installs Chrome Extension
→ Extension checks: logged-in LinkedIn matches profileSlug?
→ Yes → Extension works (10 comments/day limit)
→ History syncs to DB
→ No Hyperbrowser, no scheduling
```

**Who has LinkedIn access:** The user themselves.

---

### Scenario 2: Free User Upgrades

```
Free user wants teammates or scheduling or more comments
→ Clicks "Upgrade"
→ Stripe checkout (selects quantity)
→ Org now has stripeCustomerId + purchasedSlots
→ User clicks "Connect via Hyperbrowser"
→ Hyperbrowser session opens → user logs in → URN extracted
→ LinkedInAccount updated:
  - connectedByUserId = user
  - status = "connected"
  - urn set
→ Scheduling enabled, 100 comments/day
→ Can now invite teammates
```

**Reasoning:** Upgrade unlocks Hyperbrowser + teammates + higher limits. Same org, no data migration.

---

### Scenario 3: Paid Solo User (Owns All LinkedIn Access)

```
User upgrades to 3 slots
→ Registers 3 LinkedIn URLs (all accounts user can log into)
→ Connects each via Hyperbrowser (user logs in themselves)
→ 3 LinkedInAccounts, all owned by user's org
→ Each has own personas, target lists, settings
→ Dashboard shows all 3
→ Can schedule for each
→ 100 comments/day per account
```

**Who has LinkedIn access:** The user themselves for all 3.

---

### Scenario 4: Paid Solo User (Invites Clients to Connect)

```
User upgrades to 3 slots
→ Registers their own LinkedIn (can log in)
→ Wants to manage 2 client LinkedIns (doesn't have credentials)
→ Invites Client A and Client B to org as members
→ Client A registers + connects their LinkedIn
→ Client B registers + connects their LinkedIn
→ Now org has 3 LinkedInAccounts:
  - User's LinkedIn (registered + connected by user)
  - Client A's LinkedIn (registered + connected by Client A)
  - Client B's LinkedIn (registered + connected by Client B)
→ User (admin) can view/manage all 3 via dashboard
→ User can use Extension only on their own
(logged into their LinkedIn matching connected accounts allowed by org)
→ User can schedule for all 3 via Hyperbrowser
```

**Who has LinkedIn access:** User owns 1, clients own 2. All in same org.

---

### Scenario 5: Marketing Agency (Admin Has All Credentials)

```
Agency owner has LinkedIn credentials for all clients
→ Upgrades to 10 slots
→ Registers 10 client LinkedIn URLs
→ Connects each via Hyperbrowser (agency logs into each)
→ Invites 3 operators as members
→ All 4 users can:
  - View dashboard (all 10 accounts)
  - Schedule via Hyperbrowser (all 10)
  - Use Extension (only if logged into a matching account)
  - Create personas per account
→ Only admin can:
  - Disconnect accounts
  - Invite/remove teammates
  - Manage billing
```

**Who has LinkedIn access:** Agency has all credentials. Operators may or may not.

---

### Scenario 6: Marketing Agency (Clients Connect Own Accounts)

```
Agency upgrades to 10 slots
→ Invites 10 clients as members
→ Each client registers + connects their own LinkedIn
→ Agency admin can view/manage all 10 from dashboard
→ Agency admin can schedule for all 10
→ Each client can also manage their own account
→ If client relationship ends:
  - Admin removes client from org or they leave
  - Client's LinkedIn account connection stays in the org
  - Admin must disconnect manually (or client disconnects before they leave) for simplicity
```

**Who has LinkedIn access:** Each client owns their own credentials.

---

### Scenario 7: Startup Team (Employees Connect Own)

```
Startup admin upgrades to 5 slots
→ Invites 5 employees as members
→ Each employee registers + connects their own LinkedIn
→ Each employee primarily manages their own
→ Admin has oversight of all 5
→ All employees can see dashboard (all 5 accounts)
→ All employees can schedule for any account
→ If employee leaves company:
  - Admin removes from org
  - Employee's LinkedIn stays - must be disconnected manually
```

**Who has LinkedIn access:** Each employee owns their own.

---

### Scenario 8: Shared Personal LinkedIn (Multiple Operators)

```
Small team upgrades to 1 slot
→ Admin registers their personal LinkedIn
→ Admin connects via Hyperbrowser
→ Admin invites 2 teammates
→ All 3 can:
  - View dashboard
  - Schedule posts
  - Use Extension (if logged into admin's LinkedIn - shared credentials)
- Again - no audit trail for simplicity in db
```

**Who has LinkedIn access:** Admin owns it, shares credentials with team internally.

---

### Scenario 9: User in Multiple Orgs

```
Alice has:
├── "Alice's Workspace" (her free org) → alice-linkedin
├── "Agency A" (paid, invited as member) → 10 client LinkedIns
├── "Agency B" (paid, invited as member) → 5 different client LinkedIns

Alice switches org context in web dashboard.
Extension loads LinkedIn accounts for selected org.
Each org has different LinkedIn accounts (blocking rule enforced).
alice-linkedin is ONLY in Alice's free org (blocked from other orgs).
```

**Reasoning:** Users can be in multiple paid orgs. Each org has separate LinkedIn accounts.

---

## Chrome Extension Flow

```
User opens Extension
→ Extension calls API: "Get my current org + LinkedIn accounts"
→ API returns: { orgId, linkedInAccounts: [{ profileSlug, status }...] }
→ Extension scrapes current LinkedIn page for logged-in profile
→ Matches against org's linkedInAccounts by profileSlug
→ Match found?
  → Yes: Extension enabled for this account
  → No: "Switch to a LinkedIn account connected to your workspace"
→ User performs action (comment, like, etc.)
→ Check daily limit (10 free, 100 paid)
→ API saves: { linkedInAccountId, performedByUserId, ... }
```

**Reasoning:** Extension works on any device if logged into matching LinkedIn. No Hyperbrowser needed for Extension.

---

## LinkedIn Account Lifecycle

### Register (Any org member)

```
1. User enters LinkedIn profile URL
2. Extract profileSlug from URL
3. Check: Is this LinkedIn already registered/connected elsewhere?
   → Yes: BLOCK "This LinkedIn is registered in another workspace"
   → No: Continue
4. LinkedInAccount created/updated:
   - organizationId = user's current org
   - status = "registered"
   - profileSlug from URL
   - profileUrl = input URL
5. Extension works immediately
```

**Note:** No Apify scraping. Profile shown as URL/slug only until connected via Hyperbrowser.

### Connect (Paid orgs only)

```
1. User clicks "Connect via Hyperbrowser"
2. Check: Is org paid?
   → No: BLOCK "Upgrade to connect via Hyperbrowser"
   → Yes: Continue
3. Hyperbrowser session opens
4. User logs into LinkedIn
5. System extracts URN + profileSlug from session
6. VALIDATION: Does logged-in profileSlug match registered profileSlug?
   → No: REJECT connection
      - Show error: "You logged into a different LinkedIn account. Please log into {registeredProfileSlug}"
      - Clean up Hyperbrowser session
      - User must try again with correct account
   → Yes: Continue
7. LinkedInAccount updated:
   - status = "connected"
   - urn set
   - browserProfileId set
8. Scheduling now enabled
```

**Edge Case Handled:** User registers URL for "alice" but logs into Hyperbrowser as "bob" → rejected, must retry.

### Disconnect (Manual)

```
1. Any org member clicks disconnect on ANY account
2. LinkedInAccount updated:
   - organizationId = null
   - status = null
   - browserProfileId = null (delete Hyperbrowser profile)
   - urn = null
3. All BrowserInstances for this account: deleted
4. Data stays (personas, history remain on LinkedInAccount)
5. LinkedIn now available for other orgs to register
6. New org must re-connect via Hyperbrowser (creates new browserProfileId)
```

**Note:** Any member can disconnect any account (simplified permissions).

### User Leaves Org

```
When user is removed from org (or leaves):

→ Nothing happens to LinkedIn accounts
→ All accounts stay in org
→ All data stays intact
→ Other members continue using them
→ If needed - user disconnect account manually before leaving
```

**Reasoning:**

- No audit trail = no tracking of who registered/connected
- Accounts belong to org, not individual users
- Simplest possible model
- Admin can manually remove accounts if needed

---

### Org Downgrades (Reduce Slots)

```
Org has 5 slots, 5 LinkedIn accounts
→ Admin wants to downgrade to 3 slots

Flow (pre-validation in our UI):
1. User selects new quantity in OUR UI (not Stripe portal)
2. tRPC router checks: newQuantity >= currentAccountCount?
3. If 3 < 5: BLOCK with error "You have 5 accounts. Remove 2 before downgrading."
4. User manually removes 2 accounts
5. User retries → 3 >= 3 → allowed
6. Redirect to Stripe with locked quantity (adjustable_quantity: false)
7. Stripe processes change

Removed accounts:
- organizationId = null
- status = null
- Data preserved
```

**Reasoning:**

- Validation happens BEFORE Stripe, not after
- No webhook revert logic needed
- User gets immediate feedback
- Stripe portal just confirms (can't change quantity)

---

### Transfer (LinkedIn Registered by Different Org)

```
1. Org A has "johndoe" (status: registered or connected)
2. Org B tries to register "johndoe"
   → BLOCKED: "This LinkedIn is already registered elsewhere"
3. Org A disconnects "johndoe" (or user leaves, or org deleted)
   → "johndoe" now: organizationId = null, status = null
4. Org B registers "johndoe"
   → organizationId = Org B
   → status = "registered"
5. Org B sees full history (personas, comments belong to LinkedInAccount)
```

**Reasoning:** One LinkedIn = one org at a time. History follows the identity.

---

## Stripe Integration

### New Subscription (Checkout)

```
1. User in OUR UI selects:
   - Plan: monthly ($24.99/slot) or yearly ($249/slot)
   - Quantity: number of slots
2. Click "Subscribe"
3. tRPC router creates Stripe Checkout session:
   - adjustable_quantity: false (locked)
   - Exact quantity from our UI
4. User redirects to Stripe Checkout
5. User can only confirm (can't change quantity)
6. Webhook updates org with stripeCustomerId + slots
```

### Update Subscription (Change Quantity)

```
1. User in OUR UI adjusts quantity slider
2. Click "Update"
3. tRPC router checks: newQuantity >= currentAccountCount?
   - If no: return error "Remove X accounts first"
   - If yes: proceed
4. tRPC router calls Stripe API to update subscription
5. Webhook updates org slots
```

### Cancel Subscription

```
1. User clicks "Cancel" in OUR UI
2. tRPC router checks: currentAccountCount > 1?
   - If yes: BLOCK with error "Remove accounts until only 1 remains before canceling"
   - User manually removes accounts (each removal: disconnect + cleanup Hyperbrowser)
   - User retries until only 1 account left
3. When 1 account remains:
   - Allow cancel to proceed
   - Clean up Hyperbrowser for last account (delete browserProfileId)
   - BUT keep account registered (status = "registered", not null)
4. Redirect to Stripe Customer Portal
5. User confirms cancellation
6. Webhook updates org:
   - stripeCustomerId = null (or cleared)
   - purchasedSlots = 1
   - Org is now free tier

Result:
- Org becomes free with 1 registered account
- No Hyperbrowser access (free tier)
- Extension still works (10 comments/day)
- Account data preserved (personas, history, etc.)
```

**Reasoning:**

- User explicitly removes accounts (no auto-cleanup surprises)
- Last account kept as "registered" (matches free tier: 1 slot, no Hyperbrowser)
- Clean transition from paid → free
- Data preserved, just features reduced

**General Stripe Reasoning:**

- Pre-validation in our UI = immediate feedback
- No webhook revert logic needed
- Stripe portal only for confirmation, not quantity changes
- Simpler than handling invalid states after-the-fact

---

## Slot Logic

```
canRegisterMore = org.purchasedSlots > count(LinkedInAccounts WHERE organizationId = org.id)
```

**Reasoning:** No Slot table. Just count against limit.

---

## Access Logic

```
canAccessLinkedInAccount(user, linkedInAccountId):
  account = getLinkedInAccount(linkedInAccountId)
  if account.organizationId is null: return false
  return user.isOrgMember(account.organizationId)
```

**Reasoning:** Org membership = access to all org's LinkedIn accounts. No fine-grained permissions for MVP.

---

## LinkedIn Blocking Logic

```
canRegisterLinkedIn(profileSlug, orgId):
  existing = findLinkedInAccount(profileSlug)
  if existing is null: return true (new account)
  if existing.organizationId is null: return true (unassigned, can claim)
  if existing.organizationId === orgId: return false (already in this org)
  return false (belongs to another org - BLOCKED)
```

**Reasoning:** One LinkedIn = one org. Prevents two orgs managing same account.

---

## System Architecture

```
┌──────────────┐     ┌──────────────┐
│    Clerk     │     │   Stripe     │
│  (Auth/Org)  │     │  (Billing)   │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │ User/Org           │ Subscription
       │ Webhooks           │ Webhooks
       ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    Database                             │
│  ┌──────┐  ┌─────┐  ┌────────────────┐                 │
│  │ User │  │ Org │  │ LinkedInAccount│                 │
│  └──────┘  └─────┘  │ ├─ Personas    │                 │
│                     │ ├─ TargetLists │                 │
│                     │ ├─ Settings    │                 │
│                     │ └─ History     │                 │
│                     └────────────────┘                 │
└─────────────────────────────────────────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│     Web      │     │   Chrome     │
│  Dashboard   │◄───►│  Extension   │
└──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│ Hyperbrowser │
│ (Paid only)  │
└──────────────┘
```

---

## What Each System Handles

### Clerk

- User authentication
- Organization CRUD
- Auto-create org on user signup
- Org membership & invitations (admin only)
- Org roles (admin/member - default only)
- Webhooks for user/org sync

### Stripe

- Subscription billing
- Quantity-based pricing ($24.99/slot/mo, $249/slot/yr)
- Customer Portal (change quantity, payment)
- Webhooks for slot updates

### Hyperbrowser

- LinkedIn session management (paid only)
- URN extraction
- Session persistence for scheduling
- Enables automated actions

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    HYPERBROWSER CLOUD                        │
│                                                              │
│   Browser Profile (persistent)    Browser Session (ephemeral)│
│   ├── browserProfileId            ├── hyperbrowserSessionId  │
│   ├── Cookies                     ├── Active browser window  │
│   ├── LocalStorage                ├── Live view URL          │
│   └── Login state                 └── WebSocket connection   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                │                              │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       YOUR DATABASE                          │
│                                                              │
│   LinkedInAccount                 BrowserInstance            │
│   ├── browserProfileId ──────────►├── hyperbrowserSessionId  │
│   │   (permanent, survives        │   (ephemeral, per action)│
│   │    sessions)                  └── status: RUNNING/STOPPED│
│   └── owns the profile                                       │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**

- `browserProfileId` = persistent, stores cookies/login, created on Connect
- `hyperbrowserSessionId` = ephemeral, new session per action (auto-comment, etc.)
- Sessions are NOT reused - each action creates new session using same profile
- `BrowserInstance` table is for crash recovery, not audit
- On disconnect: delete browserProfileId from Hyperbrowser (privacy)

**Session Health Check:**

- When spawning new session, check if browserProfile auth is still valid
- If LinkedIn session expired/invalid → bubble back error status
- UI shows: "LinkedIn session expired. Please re-connect."
- User must re-connect via Hyperbrowser (re-login)

**Extension vs Hyperbrowser Conflict:**

- If user uses Extension manually while Hyperbrowser action is queued/running
- Could cause duplicate comments or LinkedIn rate limiting
- Extension should show warning: "Auto-comment is running. Manual actions may cause conflicts."

### We Build

- LinkedIn registration flow (URL + blocking check, no Apify)
- Hyperbrowser connection flow
- Chrome Extension (validates logged-in account, daily limits)
- Dashboard (per-account personas, lists, history)
- Slot limit enforcement
- User leave cleanup logic
- Downgrade handling
- Webhook handlers (Clerk + Stripe)

---

## Summary Table

| Concept              | Decision                                                       |
| -------------------- | -------------------------------------------------------------- |
| User signup          | Auto-creates personal org (1 free slot)                        |
| Org purpose          | Billing + member access management only                        |
| Data ownership       | LinkedInAccount owns everything (personas, history, settings)  |
| Audit trail          | **None** - no tracking of who created/registered/connected     |
| Free org             | 1 member, 1 slot, 10 comments/day, no Hyperbrowser             |
| Paid org             | Unlimited members, 1+ slots, 100 comments/day, Hyperbrowser    |
| Pricing              | $24.99/slot/mo or $249/slot/yr, quantity-based                 |
| LinkedIn status      | null (unassigned), registered (URL), connected (Hyperbrowser)  |
| LinkedIn blocking    | One LinkedIn = one org only                                    |
| User leaves org      | **Nothing happens** - accounts stay in org                     |
| Org deletion         | All LinkedIn become unassigned, browser profiles deleted       |
| Disconnect           | Browser profile deleted, new org must re-connect               |
| Downgrade            | **Pre-validated** in our UI before Stripe                      |
| Cancel subscription  | Remove accounts to 1, cleanup Hyperbrowser, keep as registered |
| Stripe integration   | Our UI controls quantity, Stripe just confirms                 |
| Account management   | **Any member** can manage **any account** in org               |
| Extension validation | Matches logged-in LinkedIn against org's accounts              |
| Roles                | Admin/Member only (Clerk default)                              |
| Multi-org            | Users can be in multiple orgs (different LinkedIn per org)     |
| Data duplication     | Future feature - copy lists/styles between accounts            |
