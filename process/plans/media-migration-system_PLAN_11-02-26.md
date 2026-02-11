# Media Migration System: Async S3 Upload with In-Place URL Replacement

**Date**: February 11, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Approach 2 - In-Place URL Evolution with Registry Pattern
**Execution Model**: Phase-by-Phase with Pre-Research and Post-Testing

## Overview

Build a reusable, extensible media migration system that eliminates upload latency during save operations. Media URLs (LinkedIn CDN) are saved directly to the database, then a daily DBOS workflow migrates them to S3 and replaces the URLs in-place. This includes refactoring existing S3 patterns (`avatarS3Key`/`avatarS3Url`) to use the new unified approach.

**Status**: ⏳ PLANNED

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Execution Brief](#15-execution-brief)
- [Phased Execution Workflow](#175-phased-execution-workflow)
- [Architecture Decisions](#3-architecture-decisions-final)
- [Database Schema](#11-database-schema)
- [Phased Delivery Plan](#14-phased-delivery-plan)
- [RFCs](#16-rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Context and Goals

### Problem Statement

LinkedIn CDN URLs for profile pictures, avatars, and media expire after 1-2 months. Currently, the codebase has inconsistent approaches:

1. **CommentAnalysis**: Uploads avatar to S3 synchronously during save (adds latency), stores `avatarS3Key` + `avatarS3Url`
2. **LinkedInPostPreview**: User uploads directly to S3 (correct for user uploads), stores `s3Key` + `s3Url`
3. **LinkedInProfile**: Uploads profile pic to S3 in background (fire-and-forget), but still blocks on upload
4. **Comment**: Stores `authorAvatarUrl` as LinkedIn CDN URL (will expire, never migrated)
5. **TargetProfile**: Stores `photoUrl` as LinkedIn CDN URL (will expire, never migrated)

### Goals

1. **Zero latency on save**: Store LinkedIn URLs directly, migrate asynchronously
2. **Unified pattern**: Single URL field per media type, in-place replacement
3. **Extensibility**: Easy to add new media fields via registry config
4. **Reliability**: DBOS workflow with logging for failed migrations
5. **Cleanup legacy**: Refactor existing `avatarS3Key`/`s3Key` patterns

### Success Metrics

- Save operations complete in <100ms (no S3 upload blocking)
- 95%+ of media URLs migrated to S3 within 24 hours of creation
- Adding a new media field requires only 1 line in registry config
- Zero broken images after 60 days (all migrated before expiry)

---

## 1.5 Execution Brief

### Phase 1-2: Foundation (Registry + Migration Utility)
**What happens:** Create the ephemeral media registry config and the core `migrateMediaToS3()` utility function. No schema changes yet.

**Test:** Unit test the utility with a mock LinkedIn URL, verify S3 upload and URL generation work correctly.

### Phase 3-4: DBOS Workflow (Daily Migration Job)
**What happens:** Create the DBOS scheduled workflow that iterates through the registry, finds records with LinkedIn URLs, and migrates them to S3.

**Test:** Run workflow manually, verify it finds pending media and logs migration attempts. Test with dry-run mode first.

### Phase 5-6: Refactor CommentAnalysis (Remove Sync Upload)
**What happens:** Remove `avatarS3Key`/`avatarS3Url` fields, add single `avatarUrl` field. Update router to save LinkedIn URL directly. Add to registry for async migration.

**Test:** Create new CommentAnalysis, verify avatarUrl contains LinkedIn URL. Run migration workflow, verify URL replaced with S3 URL.

### Phase 7-8: Refactor LinkedInPostPreview (Schema Rename)
**What happens:** This is direct user upload (not ephemeral), so keep sync upload. Rename `s3Key`/`s3Url` to `imageKey`/`imageUrl` for clarity.

**Test:** Create new preview, verify imageUrl populated correctly. Existing previews still work.

### Phase 9-10: Update LinkedInProfile (Remove Sync Upload)
**What happens:** Remove sync S3 upload from `saveProfileInBackground()`. Let the DBOS workflow handle migration. Add `profilePic`, `profilePictureUrl`, `coverPictureUrl` to registry.

**Test:** Scrape a new profile, verify LinkedIn URL saved immediately. Run workflow, verify S3 migration.

### Phase 11-12: Add Remaining Fields to Registry
**What happens:** Add `Comment.authorAvatarUrl` and `TargetProfile.photoUrl` to registry. These fields already exist and store LinkedIn URLs.

**Test:** Run workflow, verify existing records with LinkedIn URLs get migrated.

### Phase 13-14: Polish and Monitoring
**What happens:** Add migration logging/stats endpoint. Handle edge cases (null URLs, already-S3 URLs). Production deployment and monitoring.

**Test:** Dashboard shows migration stats. No errors in production logs after 24 hours.

### Expected Outcome
- All media fields use single URL pattern (LinkedIn initially, S3 after migration)
- DBOS workflow runs daily at 3 AM, migrates pending media
- Save operations have zero S3 latency
- Registry config makes adding new fields trivial
- Legacy `avatarS3Key`/`s3Key` fields removed

---

## 1.75 Phased Execution Workflow

**IMPORTANT**: This plan uses a phase-by-phase execution model with built-in approval gates.

### Phase Workflow Pattern

**Step 1: Pre-Phase Research**
- Read existing code patterns in codebase
- Analyze similar implementations
- Identify potential blockers or unknowns
- Present findings to user for review

**Step 2: Detailed Planning**
- Based on research, create detailed implementation steps
- Specify exact files to create/modify
- Define success criteria
- Get user approval before proceeding

**Step 3: Implementation**
- Execute approved plan exactly as specified
- No deviations from approved approach
- Mid-phase check-in if phase is long

**Step 4: Testing**
- Execute specific test scenarios (provided in RFC)
- Verify all acceptance criteria met
- Document any issues or deviations
- Show results to user

**Step 5: Phase Approval**
- User reviews implementation and test results
- User approves to proceed to next phase
- OR user requests changes (loop back to Step 2)

### Benefits of This Approach
- **User control**: Approve each phase before implementation
- **Early feedback**: Catch issues before significant work done
- **Visibility**: Clear understanding of what's being built
- **Quality**: Testing after each phase ensures incremental quality
- **Flexibility**: Easy to adjust approach based on discoveries

---

## 2. Non-Goals and Constraints

### Non-Goals
- Video transcoding or thumbnail generation (future enhancement)
- CDN distribution for S3 files (use direct S3 URLs for now)
- Real-time migration (async daily is sufficient given 1-2 month expiry)
- Migration status UI (logging is sufficient for V1)
- Preserving original LinkedIn URLs (not needed per user decision)

### Constraints
- Must use existing S3 bucket (`engagekit-linkedin-preview`)
- Must use existing DBOS infrastructure
- Migration must not block application startup
- LinkedIn URLs typically expire in 1-2 months (ample buffer with daily migration)
- Rate limiting: Don't hammer LinkedIn CDN or S3

---

## 3. Architecture Decisions (Final)

### AD-001: In-Place URL Replacement (Approach 2)

**Decision**: Use single URL field per media type. Field starts with LinkedIn CDN URL, gets replaced with S3 URL after migration.

**Rationale**:
- Zero changes to save operations (just store the URL)
- Simplest schema (no new tables, no extra fields)
- Adding new media types is trivial (1 line in registry)
- Display logic is unchanged (URL is URL)

**Trade-offs**:
- Cannot preserve original LinkedIn URL (acceptable per user)
- Migration detection via URL pattern matching (reliable for LinkedIn domains)

### AD-002: Registry Pattern for Extensibility

**Decision**: Define media fields in a TypeScript config array. DBOS workflow iterates through registry.

**Rationale**:
- Adding new field = 1 line of config
- Type-safe field definitions
- Centralized migration logic
- Easy to test in isolation

**Implementation**:
```typescript
export const EPHEMERAL_MEDIA_FIELDS = [
  { model: 'LinkedInProfile', field: 'profilePic', folder: 'profile-avatars', idField: 'id' },
  { model: 'Comment', field: 'authorAvatarUrl', folder: 'comment-avatars', idField: 'id' },
  // ... easy to extend
];
```

### AD-003: Daily DBOS Scheduled Workflow

**Decision**: Run migration at 3 AM daily using DBOS scheduled workflow.

**Rationale**:
- DBOS already used for other scheduled tasks
- ExactlyOncePerInterval ensures no duplicate runs
- 3 AM is low-traffic time
- Daily is sufficient given 1-2 month URL expiry

### AD-004: URL Pattern Detection for Migration Status

**Decision**: Detect "needs migration" by checking if URL contains LinkedIn CDN domains.

**Rationale**:
- No need for extra status field
- Simple: `WHERE field LIKE '%licdn.com%'`
- Already-migrated URLs (S3) naturally excluded

**Patterns to detect**:
- `media.licdn.com`
- `media-exp1.licdn.com` (and exp2, exp3...)
- `static.licdn.com`

### AD-005: Graceful Failure Handling

**Decision**: Log and skip failed migrations. Don't retry indefinitely.

**Rationale**:
- Expired URLs cannot be recovered
- Logging provides visibility for debugging
- Don't block workflow on single failure
- Future: Could add MediaMigrationLog table for observability

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Save Flow (Fast)                          │
├─────────────────────────────────────────────────────────────────┤
│  User Action → tRPC Router → Save LinkedIn URL to DB → Done     │
│                              (no S3 upload)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Migration Flow (Async)                         │
├─────────────────────────────────────────────────────────────────┤
│  DBOS Cron (3 AM) → Read Registry → For each model/field:       │
│    → Query records WHERE field LIKE '%licdn.com%'               │
│    → For each record:                                           │
│      → Download from LinkedIn URL                               │
│      → Upload to S3                                             │
│      → UPDATE SET field = s3Url                                 │
│    → Log results                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. S3 Folder Structure

```
engagekit-linkedin-preview/           (existing bucket)
├── profile-avatars/                  (LinkedInProfile.profilePic)
│   └── {profileId}/
│       └── {timestamp}-{random}.jpg
├── profile-covers/                   (LinkedInProfile.coverPictureUrl)
│   └── {profileId}/
│       └── {timestamp}-{random}.jpg
├── comment-avatars/                  (Comment.authorAvatarUrl, CommentAnalysis.avatarUrl)
│   └── {recordId}/
│       └── {timestamp}-{random}.jpg
├── target-photos/                    (TargetProfile.photoUrl)
│   └── {profileId}/
│       └── {timestamp}-{random}.jpg
├── comment-screenshots/              (existing - keep for backward compat)
│   └── {userId}/
│       └── avatar-{timestamp}-{random}.jpg
├── linkedin-profiles/                (existing - keep for backward compat)
│   └── {urn}/
│       └── {timestamp}-{random}.jpg
└── linkedin-previews/                (LinkedInPostPreview.imageUrl - user uploads)
    └── {userId}/
        └── {timestamp}-{random}.jpg
```

---

## 11. Database Schema

### Current State (Before)

```prisma
// CommentAnalysis - has S3 fields (to be removed)
model CommentAnalysis {
  avatarS3Key      String?   // ❌ Remove
  avatarS3Url      String?   // ❌ Remove → rename to avatarUrl
}

// LinkedInPostPreview - user uploads directly (keep, but rename)
model LinkedInPostPreview {
  s3Key       String    // ❌ Rename to imageKey
  s3Url       String    // ❌ Rename to imageUrl
}

// LinkedInProfile - some fields use S3, some don't
model LinkedInProfile {
  profilePic           String   // Currently mixed (S3 or LinkedIn)
  profilePictureUrl    String?  // Currently mixed
  coverPictureUrl      String?  // Currently LinkedIn only
}

// Comment - LinkedIn URL only (expires!)
model Comment {
  authorAvatarUrl   String?  // LinkedIn URL (no change, add to registry)
}

// TargetProfile - LinkedIn URL only (expires!)
model TargetProfile {
  photoUrl   String?  // LinkedIn URL (no change, add to registry)
}
```

### Target State (After)

```prisma
// CommentAnalysis - single URL field
model CommentAnalysis {
  avatarUrl   String?   // LinkedIn URL → S3 URL (migrated by workflow)
}

// LinkedInPostPreview - clearer naming
model LinkedInPostPreview {
  imageKey    String    // S3 key for deletion
  imageUrl    String    // S3 URL for display
}

// LinkedInProfile - no change to schema, just workflow migration
model LinkedInProfile {
  profilePic           String   // LinkedIn URL → S3 URL (migrated)
  profilePictureUrl    String?  // LinkedIn URL → S3 URL (migrated)
  coverPictureUrl      String?  // LinkedIn URL → S3 URL (migrated)
}

// Comment - no change to schema, just workflow migration
model Comment {
  authorAvatarUrl   String?  // LinkedIn URL → S3 URL (migrated)
}

// TargetProfile - no change to schema, just workflow migration
model TargetProfile {
  photoUrl   String?  // LinkedIn URL → S3 URL (migrated)
}
```

---

## 12. API Surface

### New Files to Create

```
packages/api/src/
├── services/
│   └── media-migration/
│       ├── index.ts                    # Export all
│       ├── ephemeral-media-registry.ts # Registry config
│       ├── migrate-media-to-s3.ts      # Core migration utility
│       └── linkedin-url-detector.ts    # URL pattern detection
└── workflows/
    └── media-migration.workflow.ts     # DBOS scheduled workflow
```

### Registry Config API

```typescript
// packages/api/src/services/media-migration/ephemeral-media-registry.ts

export interface EphemeralMediaField {
  model: string;           // Prisma model name
  field: string;           // Field name containing URL
  folder: string;          // S3 folder for this media type
  idField: string;         // Field to use for S3 subfolder (usually 'id')
  batchSize?: number;      // Records per batch (default: 50)
}

export const EPHEMERAL_MEDIA_FIELDS: EphemeralMediaField[] = [
  // LinkedInProfile media
  { model: 'LinkedInProfile', field: 'profilePic', folder: 'profile-avatars', idField: 'id' },
  { model: 'LinkedInProfile', field: 'profilePictureUrl', folder: 'profile-avatars', idField: 'id' },
  { model: 'LinkedInProfile', field: 'coverPictureUrl', folder: 'profile-covers', idField: 'id' },

  // Comment avatars
  { model: 'Comment', field: 'authorAvatarUrl', folder: 'comment-avatars', idField: 'id' },

  // CommentAnalysis avatars (after refactor)
  { model: 'CommentAnalysis', field: 'avatarUrl', folder: 'comment-avatars', idField: 'id' },

  // Target profile photos
  { model: 'TargetProfile', field: 'photoUrl', folder: 'target-photos', idField: 'id' },
];
```

### Migration Utility API

```typescript
// packages/api/src/services/media-migration/migrate-media-to-s3.ts

export interface MigrationResult {
  success: boolean;
  s3Url?: string;
  error?: string;
}

/**
 * Migrate a single media URL from LinkedIn CDN to S3
 */
export async function migrateMediaToS3(
  sourceUrl: string,
  folder: string,
  identifier: string,
  s3Service: S3BucketService,
): Promise<MigrationResult>;
```

### URL Detection API

```typescript
// packages/api/src/services/media-migration/linkedin-url-detector.ts

/**
 * LinkedIn CDN domain patterns that indicate ephemeral URLs
 */
export const LINKEDIN_CDN_PATTERNS = [
  'media.licdn.com',
  'media-exp',
  'static.licdn.com',
];

/**
 * Check if a URL is a LinkedIn CDN URL (ephemeral, needs migration)
 */
export function isLinkedInCdnUrl(url: string | null): boolean;

/**
 * Check if a URL is already an S3 URL (already migrated)
 */
export function isS3Url(url: string | null): boolean;
```

---

## 14. Phased Delivery Plan

### Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| RFC-001 | Registry + Migration Utility | ⏳ PLANNED |
| RFC-002 | DBOS Migration Workflow | ⏳ PLANNED |
| RFC-003 | Refactor CommentAnalysis | ⏳ PLANNED |
| RFC-004 | Refactor LinkedInPostPreview | ⏳ PLANNED |
| RFC-005 | Update LinkedInProfile | ⏳ PLANNED |
| RFC-006 | Add Remaining Fields | ⏳ PLANNED |
| RFC-007 | Polish and Monitoring | ⏳ PLANNED |

---

## 16. RFCs

### RFC-001: Registry + Migration Utility

**Summary**: Create the core infrastructure for media migration - the registry config and the migration utility function.

**Dependencies**: None (foundation)

**Files to Create**:
- `packages/api/src/services/media-migration/index.ts`
- `packages/api/src/services/media-migration/ephemeral-media-registry.ts`
- `packages/api/src/services/media-migration/migrate-media-to-s3.ts`
- `packages/api/src/services/media-migration/linkedin-url-detector.ts`

**Stage 1: Create Directory Structure**
- Create `packages/api/src/services/media-migration/` directory
- Create `index.ts` with exports

**Stage 2: Implement URL Detection**
- Create `linkedin-url-detector.ts`
- Implement `isLinkedInCdnUrl()` function
- Implement `isS3Url()` function
- Export LinkedIn CDN patterns

**Stage 3: Implement Migration Utility**
- Create `migrate-media-to-s3.ts`
- Implement `migrateMediaToS3()` function
- Use existing `uploadImageToS3()` and `generateImageKey()` utilities
- Return `MigrationResult` with success/failure info

**Stage 4: Create Registry Config**
- Create `ephemeral-media-registry.ts`
- Define `EphemeralMediaField` interface
- Create `EPHEMERAL_MEDIA_FIELDS` array (start empty, populated in later RFCs)

**Post-Phase Testing**:
- Unit test `isLinkedInCdnUrl()` with various LinkedIn URL formats
- Unit test `isS3Url()` with S3 URLs
- Integration test `migrateMediaToS3()` with a real LinkedIn profile pic URL

**Acceptance Criteria**:
- [ ] `isLinkedInCdnUrl('https://media.licdn.com/dms/image/...')` returns `true`
- [ ] `isLinkedInCdnUrl('https://engagekit.s3.us-west-2.amazonaws.com/...')` returns `false`
- [ ] `migrateMediaToS3()` successfully uploads to S3 and returns S3 URL
- [ ] All functions exported from `index.ts`

---

### RFC-002: DBOS Migration Workflow

**Summary**: Create the scheduled DBOS workflow that runs daily and migrates pending media.

**Dependencies**: RFC-001

**Files to Create**:
- `packages/api/src/workflows/media-migration.workflow.ts`

**Files to Modify**:
- `packages/api/src/workflows/index.ts` (add import)

**Stage 1: Create Workflow File**
- Create `media-migration.workflow.ts`
- Import DBOS, registry, migration utility
- Initialize S3 service

**Stage 2: Implement Migration Logic**
- Create `migrateEphemeralMediaWorkflow` function
- Iterate through `EPHEMERAL_MEDIA_FIELDS`
- For each field, query records with LinkedIn URLs
- Call `migrateMediaToS3()` for each record
- Update database with S3 URL
- Log results

**Stage 3: Register Scheduled Workflow**
- Register with DBOS scheduler
- Cron: `0 3 * * *` (3 AM daily)
- Mode: `ExactlyOncePerInterval`

**Stage 4: Add to Workflow Index**
- Import in `index.ts`
- Export for manual triggering if needed

**Post-Phase Testing**:
- Add a test entry to registry (mock model)
- Run workflow manually via DBOS
- Verify logging output
- Verify no errors thrown

**Acceptance Criteria**:
- [ ] Workflow registered with DBOS
- [ ] Logs "Starting media migration..." on run
- [ ] Iterates through registry (even if empty)
- [ ] Handles errors gracefully (logs and continues)
- [ ] Exported from workflows/index.ts

---

### RFC-003: Refactor CommentAnalysis

**Summary**: Remove `avatarS3Key`/`avatarS3Url` fields, add `avatarUrl` field. Update router to save LinkedIn URL directly.

**Dependencies**: RFC-001, RFC-002

**Files to Modify**:
- `packages/db/prisma/models/tools/comment-analysis.prisma`
- `packages/api/src/router/tools/comment-ai-detector.ts`
- `packages/api/src/services/media-migration/ephemeral-media-registry.ts`

**Stage 1: Schema Migration**
- Add `avatarUrl String?` field
- Keep `avatarS3Key` and `avatarS3Url` temporarily (for data migration)
- Run `pnpm db:generate`

**Stage 2: Data Migration Script**
- Create one-time migration: copy `avatarS3Url` to `avatarUrl` where exists
- For records with only LinkedIn URL in `avatarS3Url`, keep as-is (workflow will migrate)

**Stage 3: Update Router**
- Remove `uploadAvatarToS3()` call in `saveAnalysis`
- Save `input.avatarUrl` directly to `avatarUrl` field
- Update `delete` mutation to not delete from S3 (workflow manages lifecycle)

**Stage 4: Add to Registry**
- Add CommentAnalysis.avatarUrl to `EPHEMERAL_MEDIA_FIELDS`

**Stage 5: Cleanup Schema**
- Remove `avatarS3Key` and `avatarS3Url` fields
- Run `pnpm db:generate` and `pnpm db:migrate dev`

**Post-Phase Testing**:
- Create new CommentAnalysis via API
- Verify `avatarUrl` contains LinkedIn URL (not S3)
- Run migration workflow
- Verify `avatarUrl` now contains S3 URL
- Verify old records still work

**Acceptance Criteria**:
- [ ] New CommentAnalysis saves in <100ms (no S3 upload blocking)
- [ ] `avatarUrl` field exists and is populated
- [ ] `avatarS3Key`/`avatarS3Url` fields removed
- [ ] Migration workflow successfully migrates CommentAnalysis avatars
- [ ] Delete mutation still works (no S3 cleanup needed)

---

### RFC-004: Refactor LinkedInPostPreview

**Summary**: Rename `s3Key`/`s3Url` to `imageKey`/`imageUrl` for clarity. This is direct user upload, so keep sync upload pattern.

**Dependencies**: None (independent)

**Files to Modify**:
- `packages/db/prisma/models/tools/linkedin-post-preview.prisma`
- `packages/api/src/router/tools/linkedin-preview.ts`

**Stage 1: Schema Migration**
- Rename `s3Key` → `imageKey`
- Rename `s3Url` → `imageUrl`
- Run migration with `prisma migrate dev --name rename-linkedin-preview-fields`

**Stage 2: Update Router**
- Update all references from `s3Key`/`s3Url` to `imageKey`/`imageUrl`
- No logic changes (user uploads directly to S3, which is correct)

**Stage 3: Update Types**
- Update any TypeScript types/interfaces referencing these fields

**Post-Phase Testing**:
- Create new LinkedInPostPreview via API
- Verify `imageKey` and `imageUrl` populated correctly
- Verify existing records still accessible (migration preserved data)

**Acceptance Criteria**:
- [ ] Schema uses `imageKey`/`imageUrl` field names
- [ ] Router uses new field names
- [ ] Existing previews still work
- [ ] New previews created successfully

---

### RFC-005: Update LinkedInProfile Save Logic

**Summary**: Remove synchronous S3 upload from `saveProfileInBackground()`. Let DBOS workflow handle migration.

**Dependencies**: RFC-001, RFC-002

**Files to Modify**:
- `packages/api/src/router/linkedin-profile-scrape.ts`
- `packages/api/src/services/media-migration/ephemeral-media-registry.ts`

**Stage 1: Remove Sync Upload**
- Remove `uploadImageToS3()` call from `saveProfileInBackground()`
- Remove S3 service initialization (if only used for this)
- Save LinkedIn URLs directly to `profilePic`, `profilePictureUrl`, `coverPictureUrl`

**Stage 2: Add to Registry**
- Add LinkedInProfile.profilePic to registry
- Add LinkedInProfile.profilePictureUrl to registry
- Add LinkedInProfile.coverPictureUrl to registry

**Stage 3: Cleanup Imports**
- Remove unused `generateImageKey`, `uploadImageToS3` imports if no longer needed

**Post-Phase Testing**:
- Scrape a new LinkedIn profile
- Verify LinkedIn URLs saved immediately (no S3 upload blocking)
- Verify `profilePic` contains LinkedIn URL
- Run migration workflow
- Verify `profilePic` now contains S3 URL

**Acceptance Criteria**:
- [ ] Profile scrape completes faster (no S3 upload blocking)
- [ ] LinkedIn URLs saved directly to DB
- [ ] Migration workflow migrates profile pictures
- [ ] Existing profiles with S3 URLs still work

---

### RFC-006: Add Remaining Fields to Registry

**Summary**: Add `Comment.authorAvatarUrl` and `TargetProfile.photoUrl` to the registry. These fields already exist and store LinkedIn URLs.

**Dependencies**: RFC-002

**Files to Modify**:
- `packages/api/src/services/media-migration/ephemeral-media-registry.ts`

**Stage 1: Add Comment.authorAvatarUrl**
- Add entry to `EPHEMERAL_MEDIA_FIELDS`
- Folder: `comment-avatars`
- idField: `id`

**Stage 2: Add TargetProfile.photoUrl**
- Add entry to `EPHEMERAL_MEDIA_FIELDS`
- Folder: `target-photos`
- idField: `id`

**Post-Phase Testing**:
- Check existing Comments with LinkedIn avatarUrls
- Run migration workflow
- Verify some Comments now have S3 URLs
- Check existing TargetProfiles with LinkedIn photoUrls
- Verify some TargetProfiles now have S3 URLs

**Acceptance Criteria**:
- [ ] Registry contains Comment.authorAvatarUrl
- [ ] Registry contains TargetProfile.photoUrl
- [ ] Migration workflow processes both fields
- [ ] Existing records migrated successfully

---

### RFC-007: Polish and Monitoring

**Summary**: Add logging, handle edge cases, prepare for production deployment.

**Dependencies**: RFC-001 through RFC-006

**Files to Modify**:
- `packages/api/src/workflows/media-migration.workflow.ts`

**Stage 1: Enhanced Logging**
- Log migration start/end times
- Log count of records processed per model/field
- Log success/failure counts

**Stage 2: Edge Case Handling**
- Skip null/empty URLs
- Skip already-S3 URLs (double-check)
- Handle network timeouts gracefully
- Add retry logic for transient failures (optional)

**Stage 3: Rate Limiting**
- Add delay between uploads (500ms)
- Limit batch size to prevent memory issues

**Stage 4: Production Deployment**
- Verify DBOS conductor connection in production
- Monitor first few workflow runs
- Verify no errors in logs

**Post-Phase Testing**:
- Run workflow with mixed data (some LinkedIn, some S3, some null)
- Verify correct handling of all cases
- Check logs for expected output

**Acceptance Criteria**:
- [ ] Logs show clear migration progress
- [ ] Null URLs skipped gracefully
- [ ] Already-migrated URLs skipped
- [ ] Rate limiting prevents overload
- [ ] Production deployment successful

---

## 17. Rules (for this project)

### Code Standards
- Use existing `S3BucketService` from `@sassy/s3`
- Use existing `uploadImageToS3()` utility
- Follow DBOS workflow patterns from `account.workflows.ts`
- Use Prisma for all database operations

### Naming Conventions
- Media field folders: kebab-case (`profile-avatars`, `comment-avatars`)
- S3 keys: `{folder}/{identifier}/{timestamp}-{random}.{ext}`
- Workflow names: `{action}-{subject}-workflow`

### Error Handling
- Log errors with `console.error()` or `DBOS.logger.error()`
- Don't throw on migration failure (log and continue)
- Return error details in `MigrationResult`

### Testing
- Test URL detection with real LinkedIn URLs
- Test migration with mock S3 service for unit tests
- Integration test with real S3 for end-to-end

---

## 18. Implementation Checklist

### RFC-001: Registry + Migration Utility
- [ ] Create `packages/api/src/services/media-migration/` directory
- [ ] Create `index.ts` with exports
- [ ] Create `linkedin-url-detector.ts` with `isLinkedInCdnUrl()` and `isS3Url()`
- [ ] Create `migrate-media-to-s3.ts` with `migrateMediaToS3()`
- [ ] Create `ephemeral-media-registry.ts` with empty registry
- [ ] Test URL detection functions
- [ ] Test migration utility

### RFC-002: DBOS Migration Workflow
- [ ] Create `packages/api/src/workflows/media-migration.workflow.ts`
- [ ] Implement `migrateEphemeralMediaWorkflow`
- [ ] Register with DBOS scheduler (3 AM daily)
- [ ] Import in `workflows/index.ts`
- [ ] Test manual workflow trigger

### RFC-003: Refactor CommentAnalysis
- [ ] Add `avatarUrl` field to schema
- [ ] Create data migration (copy existing S3 URLs)
- [ ] Update `saveAnalysis` to save LinkedIn URL directly
- [ ] Update `delete` mutation
- [ ] Add to registry
- [ ] Remove `avatarS3Key`/`avatarS3Url` fields
- [ ] Run migration
- [ ] Test end-to-end

### RFC-004: Refactor LinkedInPostPreview
- [ ] Rename `s3Key` → `imageKey` in schema
- [ ] Rename `s3Url` → `imageUrl` in schema
- [ ] Update router references
- [ ] Run migration
- [ ] Test existing and new previews

### RFC-005: Update LinkedInProfile
- [ ] Remove sync S3 upload from `saveProfileInBackground()`
- [ ] Add `profilePic`, `profilePictureUrl`, `coverPictureUrl` to registry
- [ ] Remove unused imports
- [ ] Test profile scrape speed
- [ ] Test migration workflow

### RFC-006: Add Remaining Fields
- [ ] Add `Comment.authorAvatarUrl` to registry
- [ ] Add `TargetProfile.photoUrl` to registry
- [ ] Test migration of existing records

### RFC-007: Polish and Monitoring
- [ ] Add enhanced logging
- [ ] Handle edge cases (null, already-migrated)
- [ ] Add rate limiting
- [ ] Deploy to production
- [ ] Monitor first workflow runs

---

## 19. Cursor + RIPER-5 Guidance

### Cursor Plan Mode
- Import "Implementation Checklist" steps directly
- Execute by RFC (each RFC is a phase)
- After each RFC, update status markers (⏳ → 🚧 → ✅)
- Reattach this plan to future sessions for context

### RIPER-5 Mode
- **RESEARCH**: Read existing code (S3 utils, DBOS workflows, routers)
- **INNOVATE**: Already completed (Approach 2 selected)
- **PLAN**: This document is the plan
- **EXECUTE**: Implement RFC-by-RFC after user approval
- **REVIEW**: Validate implementation matches plan after each RFC

### Execution Command
To begin implementation:
```
"ENTER EXECUTE MODE - Start with RFC-001: Registry + Migration Utility"
```

---

## 20. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LinkedIn URL expires before migration | Low | Medium | Daily migration provides 30+ day buffer |
| S3 upload fails | Low | Low | Log and skip, retry on next run |
| DBOS workflow fails | Low | Medium | ExactlyOncePerInterval ensures retry |
| Schema migration breaks existing data | Medium | High | Add new fields first, migrate data, then remove old fields |
| Rate limiting by LinkedIn CDN | Low | Low | Add delays between downloads |

---

## 21. Future Enhancements

- **MediaMigrationLog table**: Track migration history for observability
- **Video support**: Extend registry for video files
- **CDN distribution**: Add CloudFront for better global performance
- **Thumbnail generation**: Auto-generate thumbnails for large images
- **Migration status API**: Endpoint to check migration progress
- **Manual re-migration**: Ability to force re-upload for specific records
