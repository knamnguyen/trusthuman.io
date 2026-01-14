# Schema Rework Plan

**Date:** 2026-01-09
**Status:** Planning

---

## Overview

Reworking the database schema to support the new Chrome extension (wxt-extension) with clean relationships and account-centric ownership model.

---

## Ownership Model

```
Organization ──owns──→ LinkedInAccount[] (via organizationId)
     │
     └── has members ──→ User[] (via OrganizationMember junction)
```

- **Organization owns LinkedInAccounts** - once added to org, org owns it
- **All org members can operate any account** in the org
- **ownerId** is nullable - just records who registered it (future: admin + ownerId can remove)
- **OrganizationMember** is just a junction table for User ↔ Organization (many-to-many)

---

## Tables in Scope

| Layer | Table | Purpose |
|-------|-------|---------|
| Identity | User | Clerk user |
| Identity | Organization | Clerk org |
| Identity | OrganizationMember | User ↔ Org junction |
| Account | LinkedInAccount | Connected LI account |
| Settings | CommentGenerateSetting | AI generation config (1:1 per account) |
| Settings | PostLoadSetting | Post loading config (1:1 per account) |
| Settings | CommentStyle | Reusable style templates (many per account) |
| Data | Comment | Comments made |
| Data | LinkedInProfile | Scraped profile data (shared) |
| Targeting | TargetList | List of targets (per account) |
| Targeting | TargetProfile | Individual target in list |

**Ignoring for now:** BlacklistedProfile table (using blacklistIds in PostLoadSetting instead)

---

## Settings Per Account

```
LinkedInAccount (1) ──→ (1) CommentGenerateSetting (created on account registration)
                   ──→ (1) PostLoadSetting (created on account registration)
                   ──→ (many) CommentStyle (exclusive, no sharing between accounts)
                   ──→ (many) TargetList (exclusive)
                   ──→ (many) Comment
```

- Settings created on LinkedInAccount registration (registerByUrl)
- Settings should have sensible defaults
- Each account's data is completely separate (no sharing)

---

## Relation vs Simple ID Reference

### When to Use Relation
1. Need Prisma `include` - fetch related data in one query
2. Need cascade behavior - `onDelete: SetNull` or `onDelete: Cascade`
3. FK constraint matters - ensure the ID actually exists
4. Core domain relationship - fundamental to the model

### When to Use Simple ID (String/String[])
1. Just a filter - "use these IDs to filter results"
2. Stale IDs acceptable - orphan ID is harmless if referenced item deleted
3. Rarely need the full object - just need IDs for lookups
4. Avoiding join table complexity

---

## Field Decisions

### CommentGenerateSetting.commentStyleId → CommentStyle

**Decision: YES, use relation with `@unique` (optional 1:1)**

Why:
- Need `include: { defaultCommentStyle: true }` to show style name in UI
- Need `onDelete: SetNull` - if style deleted, default becomes null
- Core config setting, not just a filter
- **`@unique` because**: each CommentStyle belongs to 1 account, and each account has 1 setting, so each style can only be default for 1 setting

**Relationship type:** Optional 1:1
- CommentGenerateSetting → CommentStyle: 0 or 1 (nullable, no default selected yet)
- CommentStyle → CommentGenerateSetting: 0 or 1 (style may not be chosen as default)

```prisma
commentStyleId      String?  @unique  // each style can only be default for 1 setting
defaultCommentStyle CommentStyle? @relation(fields: [commentStyleId], references: [id], onDelete: SetNull)
```

---

### PostLoadSetting.targetListId → TargetList

**Decision: YES, use relation**

Why:
- Need to show target list name in UI
- Need `onDelete: SetNull` - if list deleted, setting becomes "load from newsfeed"
- Core to the feature - "which list am I loading from"

```prisma
targetListId String?
targetList   TargetList? @relation(fields: [targetListId], references: [id], onDelete: SetNull)
```

---

### PostLoadSetting.blacklistIds → TargetList[]

**Decision: REMOVED FOR NOW**

Blacklist feature (blacklistEnabled, blacklistIds) removed from PostLoadSetting for simplicity. Can be added later if needed.

---

### LinkedInAccount.ownerId → User

**Decision: Keep relation but make nullable**

- Just records who registered the account
- Org ownership is what matters now
- Future: admin + ownerId can remove account

```prisma
ownerId String?  //nullable - just records who registered, not true ownership
owner   User?    @relation(fields: [ownerId], references: [id])
```

---

### CommentStyle.userId → User

**Decision: Keep relation but make optional (legacy)**

- New styles use accountId only
- Keep for backward compatibility with existing data

```prisma
//legacy - keep for backward compatibility, new styles use accountId only
userId String?
user   User?   @relation(fields: [userId], references: [id])
```

---

## Fixes Required

### 1. CommentStyle

| Issue | Fix |
|-------|-----|
| Missing `accountId` field | Add `accountId String` |
| Missing `userId` field | Add `userId String?` (optional, legacy) |
| Missing back-relation for CommentGenerateSetting | Add `CommentGenerateSetting?` (singular - optional 1:1) |

### 2. CommentGenerateSetting

| Issue | Fix |
|-------|-----|
| Missing `commentStyleId` field | Add `commentStyleId String? @unique` (optional 1:1 with CommentStyle) |

### 3. PostLoadSetting

| Issue | Fix |
|-------|-----|
| Invalid syntax line 2 (`=>`) | Fix comment syntax |
| Missing defaults | Add defaults for boolean fields |
| Missing targetList relation | Add `targetListId String? @unique` + relation |
| Blacklist feature | Removed for now (blacklistEnabled, blacklistIds) |
| minPostAge comment | Corrected - posts younger than X hours |

### 4. LinkedInAccount

| Issue | Fix |
|-------|-----|
| Missing back-relations | Add `CommentStyle[]`, `CommentGenerateSetting?`, `PostLoadSetting?` |
| `ownerId` should be nullable | Make `String?` |

### 5. TargetList

| Issue | Fix |
|-------|-----|
| Missing back-relation for PostLoadSetting.targetListId | Add `PostLoadSetting?` |

### 6. Organization

| Issue | Fix |
|-------|-----|
| None - already fixed | `orgSlug String?` is correct |

### 7. OrganizationMember

| Issue | Fix |
|-------|-----|
| `linkedInAccountId` is legacy | Keep with comment, mark for future deletion |

---

## Legacy Fields to Keep (Backward Compatibility)

| Table | Field | Note |
|-------|-------|------|
| User | stripeCustomerId | Moving to Org, keep for now |
| User | accessType | Moving to LinkedInAccount, keep for now |
| User | dailyAIcomments | Keep |
| CommentStyle | userId, user | Moving to accountId, keep for now |
| LinkedInAccount | registrationStatus | Marked for delete |
| OrganizationMember | linkedInAccountId | Marked for delete |

---

## Implementation Order

1. [x] **CommentStyle** - Added accountId, userId?, CommentGenerateSetting? back-relation
2. [x] **CommentGenerateSetting** - Added commentStyleId? @unique
3. [x] **PostLoadSetting** - Fixed syntax, added defaults, added targetListId? @unique + relation, removed blacklist
4. [x] **LinkedInAccount** - Added back-relations, made ownerId nullable
5. [x] **TargetList** - Added PostLoadSetting? back-relation
6. [x] **Run prisma format** - Schema validated successfully
7. [ ] **Generate migration** - Create migration file
8. [ ] **Test** - Verify relationships work

---

## Notes

- BlacklistedProfile table is ignored for now - using blacklistIds in PostLoadSetting instead
- All settings created on LinkedInAccount registration with defaults
- Account data is completely isolated - no sharing between accounts
