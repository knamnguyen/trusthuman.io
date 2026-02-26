# Webcam-Based Human Verification: Server-Verified Snapshot PRD

**Date**: February 15, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Server-Verified Snapshot (Approach 2)
**Execution Model**: Phase-by-Phase with Pre-Research and Post-Testing

## Overview

Add webcam-based human verification to the EngageKit WXT Chrome extension. When a user submits a comment, the extension captures a single webcam photo, runs client-side face detection for instant feedback, uploads the photo to S3, and sends it for server-side face detection and quality analysis. The result (verified/not-verified plus confidence score) is stored alongside the comment. The web dashboard displays verification badges on comments and aggregates a trust score per profile.

**Status**: PLANNED

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Execution Brief](#15-execution-brief)
- [Architecture Decisions](#3-architecture-decisions)
- [Architecture Diagram](#4-architecture-diagram)
- [Server-Side Detection Pipeline (RFC-002)](#rfc-002-server-side-face-detection-pipeline)
- [Database Schema](#database-schema)
- [Phased Delivery Plan](#13-phased-delivery-plan)
- [RFCs](#rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Context and Goals

EngageKit automates LinkedIn commenting with AI. The "peak touch score" (0-100%) measures how much users edit AI-generated comments, but it does not prove a human was physically present. Webcam verification adds a cryptographic layer of trust: a real human face was behind the screen when the comment was submitted.

**Why this matters**:
- Differentiates EngageKit from pure bot tools
- Enables "Human Verified" trust badges on public comment history
- Provides anti-fraud evidence for premium accounts
- Creates a viral loop: verified badges are shareable, driving organic acquisition

**In-scope**:
- Camera capture via offscreen document (MV3 requirement)
- Client-side face detection with MediaPipe for instant UX feedback
- Server-side face detection with `@vladmandic/human` (Node.js) for authoritative verification
- S3 photo upload via presigned URLs (reuses existing `s3Upload` router)
- Comment model extensions for verification data
- New `VerificationAttestation` model for audit trail
- Verification badges on web dashboard history page
- Trust score aggregation and profile tiers (Gold/Silver/Bronze)
- User settings: opt-in/opt-out, show/hide selfie, auto-capture vs confirm
- Batch submit: single capture covers all comments in batch
- Graceful degradation: camera denied = comments still work, marked "unverified"

**Out-of-scope (V1)**:
- Video recording or multi-frame capture
- Liveness detection with head movement challenges
- Blockchain-based attestation
- Environment attestation (screen recording, browser integrity)
- Mobile app verification
- Third-party identity verification services (Jumio, Onfido)
- Real-time streaming verification

---

## 1.5 Execution Brief

### Phase 1: Extension Camera Infrastructure (RFC-001)
**What happens**: Add offscreen document for camera access, create message passing between content script and offscreen document, integrate MediaPipe WASM for client-side face detection.

**Test**: Offscreen document opens camera, captures frame, detects face, returns result to content script.

### Phase 2: Server-Side Detection Pipeline (RFC-002)
**What happens**: Create a new `packages/verification` package with `@vladmandic/human` for face detection, quality analysis, and anti-spoofing checks. Build a detection pipeline that accepts JPEG buffer and returns structured verification result.

**Test**: Unit tests with sample images (face present, no face, printed photo, virtual webcam).

### Phase 3: Upload and Storage (RFC-003)
**What happens**: Configure S3 bucket folder for verification photos, create presigned URL endpoint, implement upload-from-extension flow. Add data retention cron job.

**Test**: Extension captures photo, gets presigned URL, uploads to S3, URL is accessible.

### Phase 4: Database Schema Changes (RFC-004)
**What happens**: Add verification fields to Comment model, create VerificationAttestation model, run Prisma migration.

**Test**: Migration applies cleanly, new fields queryable, existing comments unaffected.

### Phase 5: tRPC API Layer (RFC-005)
**What happens**: Create `verification` tRPC router with endpoints for submitting verification, querying verification status, and managing verification settings.

**Test**: Full round-trip: extension calls saveSubmitted with verification data, server processes and stores result.

### Phase 6: Extension UX Integration (RFC-006)
**What happens**: Modify submit flow to trigger camera capture before DOM injection. Build camera preview overlay in sidebar. Handle batch submit with single capture. Add settings UI.

**Test**: Click Submit -> camera preview appears -> face detected -> "Verify & Submit" -> comment posts with verification data saved.

### Phase 7: Web App Verification Display (RFC-007)
**What happens**: Add verification badges to CommentCard, create verification details panel, build trust score section, implement profile tiers.

**Test**: History page shows "Human Verified" badges, click reveals details, profile shows trust tier.

### Phase 8: Settings and Privacy (RFC-008)
**What happens**: Add user consent flow, data controls (delete photos, opt-out), GDPR compliance, privacy policy updates.

**Test**: User can toggle verification on/off, delete verification photos, export verification data.

### Expected Outcome
- Users can optionally verify their humanity with a webcam snapshot at comment time
- Server-side face detection provides authoritative verification (not spoofable client-side)
- Verification badges appear on comment history in web dashboard
- Profile trust tiers (Gold/Silver/Bronze) based on verification percentage
- Camera denial gracefully degrades to unverified comments
- Photos stored in S3 with configurable retention
- Full audit trail via VerificationAttestation model

---

## 2. Non-Goals and Constraints

**Non-Goals**:
- Real-time video verification or liveness challenges
- Replacing peak touch score (verification is complementary)
- Mandatory verification (always opt-in)
- Face recognition/identification (we only detect IF a face exists, not WHO)
- Cross-device verification correlation
- Verification for Hyperbrowser/cloud-automated comments

**Constraints**:
- Chrome MV3: content scripts cannot access getUserMedia; must use offscreen document
- Extension size: MediaPipe WASM adds ~4MB to extension bundle
- S3 storage costs: ~$0.023/GB/month, ~30-50KB per photo
- Server compute: `@vladmandic/human` runs on Node.js (Vercel serverless), cold starts ~2-3s
- Privacy: Photos are sensitive PII; GDPR compliance required
- Existing extension permissions must be updated (no `camera` permission needed for offscreen API, but `offscreen` permission is required)

---

## 3. Architecture Decisions

### AD-001: Offscreen Document for Camera Access

**Decision**: Use Chrome's Offscreen Document API to access getUserMedia, with message passing to/from the content script via the background service worker.

**Rationale**:
- Content scripts in MV3 cannot call `navigator.mediaDevices.getUserMedia()` (no access to extension origin's media permissions)
- Offscreen documents run in the extension's origin and CAN access getUserMedia
- The offscreen document is invisible, created on demand, and destroyed after capture
- Message flow: content script -> background SW -> offscreen document -> capture -> background SW -> content script

**Implications**:
- Requires `offscreen` permission in manifest
- Requires `"reasons": ["USER_MEDIA"]` when creating offscreen document
- Only ONE offscreen document can exist at a time per extension
- Must handle lifecycle (create before capture, destroy after)

### AD-002: Client-Side Face Detection with MediaPipe (Instant UX) + Server-Side with @vladmandic/human (Authoritative)

**Decision**: Two-tier detection architecture:
1. **Client-side (MediaPipe FaceDetection WASM)**: Runs in offscreen document for instant face-detected/not-detected feedback before upload. Prevents uploading frames with no face.
2. **Server-side (@vladmandic/human)**: Runs on Node.js server for authoritative verification with quality analysis, anti-spoofing, and confidence scoring. This is the source of truth.

**Why @vladmandic/human over alternatives**:

| Option | Cost | Latency | Quality | Anti-Spoofing | Self-Hosted |
|--------|------|---------|---------|---------------|-------------|
| AWS Rekognition | ~$0.001/image | 200-500ms | Excellent | Limited | No |
| @vladmandic/human | Free | 300-800ms | Very Good | Good (texture) | Yes |
| Replicate/HF API | ~$0.002/image | 500-2000ms | Varies | Varies | No |
| TF.js BlazeFace | Free | 100-300ms | Basic | None | Yes |

**Selected: @vladmandic/human** because:
- **Free**: No per-image costs (critical at scale, 1000s of comments/day across users)
- **Self-hosted**: No external API dependency, no data leaves our servers
- **Comprehensive**: Single library provides face detection, face mesh, anti-spoofing texture analysis, quality metrics, all in one package
- **Node.js native**: Runs directly in our existing Node.js/Vercel serverless functions (uses TFJS backend, no GPU required)
- **Privacy-first**: Photos never leave our infrastructure (important for GDPR)
- **Anti-spoofing built-in**: Texture analysis can detect printed photos (Moire patterns), screens, and virtual webcams
- **Active maintenance**: Regular updates, good documentation, TypeScript types included

**Implications**:
- New `packages/verification` package for the detection pipeline
- `@vladmandic/human` adds ~15MB to server dependencies (model weights loaded once, cached)
- Cold start on serverless: ~2-3s for first request (model loading), subsequent requests ~300-800ms
- Must configure TFJS backend (CPU-only on Vercel, which is acceptable for single-image analysis)

### AD-003: Presigned URL Upload from Extension

**Decision**: Extension gets a presigned S3 URL from the server, then uploads the photo directly to S3 (bypassing the server for the binary upload).

**Rationale**:
- Reuses existing `s3Upload.getUploadUrl` pattern already in codebase
- Avoids sending large binary payloads through tRPC (which uses JSON)
- Reduces server load (S3 handles the upload)
- Extension already has network access to S3 via host_permissions

**Implications**:
- Two network calls: (1) get presigned URL, (2) PUT to S3
- S3 bucket needs CORS configured for extension origin
- Photo URL is predictable (folder/userId/timestamp-random.jpg)

### AD-004: Verification Data on Comment Model (Not Separate Table)

**Decision**: Add verification fields directly to the Comment model rather than a separate VerificationResult table. Additionally, create a VerificationAttestation model for rich audit trail.

**Rationale**:
- 1:1 relationship (one verification per comment) - no need for a join table
- Simplifies queries (no JOIN needed to check if comment is verified)
- Fields are nullable (existing comments remain unverified, no migration issues)
- VerificationAttestation stores the detailed analysis (confidence breakdown, anti-spoofing results) separately to keep Comment model lean

### AD-005: Single Capture for Batch Submit

**Decision**: When user clicks "Submit All" for batch comments, capture ONE photo at batch start. That single verification covers all comments in the batch.

**Rationale**:
- Capturing per-comment in a batch would be absurd UX (open camera 10 times)
- The human is verified once; all comments submitted in that session share the verification
- VerificationAttestation links to multiple comments via a shared `batchVerificationId`

### AD-006: Graceful Degradation

**Decision**: If user denies camera permission OR verification fails, comments are still submitted normally but marked as "unverified".

**Rationale**:
- Verification is a trust enhancement, not a gating mechanism
- Users should never be blocked from their core workflow (commenting)
- Unverified comments still have peak touch score for differentiation
- Camera permission is a sensitive browser prompt; forcing it would cause churn

---

## 4. Architecture Diagram

```
EXTENSION (Chrome MV3)                              SERVER (Next.js/Vercel)
========================                             =======================

Content Script (linkedin.com)
    |
    | 1. User clicks "Submit"
    |
    v
[Verification Store] ----chrome.runtime.sendMessage----> Background SW
    |                                                        |
    |                                                        | 2. Create offscreen doc
    |                                                        v
    |                                                 [Offscreen Document]
    |                                                   (offscreen.html)
    |                                                        |
    |                                                        | 3. getUserMedia()
    |                                                        | 4. Capture frame (canvas)
    |                                                        | 5. MediaPipe face detection
    |                                                        |    (client-side, instant)
    |                                                        |
    |                                                        | 6. Return JPEG blob +
    |                                                        |    client detection result
    |                                                        v
    |                  <--chrome.runtime.sendMessage---- Background SW
    |                                                   (destroys offscreen doc)
    v
Content Script receives JPEG blob
    |
    | 7. Get presigned URL  ----tRPC----->  s3Upload.getUploadUrl
    |                       <-presignedUrl-
    |
    | 8. PUT JPEG to S3     ----fetch----->  S3 Bucket
    |                                        (verification-photos/{userId}/...)
    |
    | 9. Save comment with  ----tRPC----->  comment.saveSubmitted
    |    verification data                   (stores s3Key, marks pending)
    |
    | 10. Submit comment to LinkedIn DOM
    |
    | 11. Trigger server     ----tRPC----->  verification.analyze
    |     verification                        |
    |                                         | 12. Download from S3
    |                                         | 13. @vladmandic/human:
    |                                         |     - Face detection
    |                                         |     - Quality analysis
    |                                         |     - Anti-spoofing
    |                                         |     - Confidence scoring
    |                                         |
    |                                         | 14. Create VerificationAttestation
    |                                         | 15. Update Comment verification fields
    |                                         |
    |     <---verification result-----        v
    v
Content Script updates UI (badge appears)


WEB DASHBOARD (Next.js)
========================

History Page
    |
    | comment.listByAccount returns verification fields
    |
    v
CommentCard
    |-- "Human Verified" badge (if isHumanVerified === true)
    |-- Verification details on click (timestamp, confidence, method)
    |-- Optional selfie thumbnail (if user opted in)
    |
Profile Section
    |-- Trust Score: "X% of comments are human-verified"
    |-- Profile Tier: Gold (>90%) / Silver (>70%) / Bronze (>50%)
```

---

## 5. Server-Side Detection Pipeline (Detailed)

This section specifies the exact algorithm, checks, and scoring used by `@vladmandic/human` on the server.

### 5.1 Detection Pipeline Overview

```
Input: JPEG buffer (640x480, ~30-50KB)
    |
    v
[Step 1] Image Decode & Validation
    - Decode JPEG to pixel array
    - Validate dimensions (min 320x240, max 1920x1080)
    - Validate file size (min 5KB, max 500KB)
    - Check EXIF for manipulation flags
    |
    v
[Step 2] Face Detection (human.detect)
    - Model: blazeface (built into @vladmandic/human)
    - Output: bounding boxes, landmarks, confidence per face
    - Requirement: Exactly 1 face detected (0 = fail, 2+ = flag)
    |
    v
[Step 3] Face Quality Assessment
    - Face size: bounding box must be >= 15% of frame area
    - Face position: center of face within middle 70% of frame
    - Sharpness: Laplacian variance of face region > threshold
    - Exposure: Mean luminance of face region 40-220 (not too dark/bright)
    |
    v
[Step 4] Anti-Spoofing Analysis
    - Texture analysis: Check for Moire patterns (printed photos)
    - Frequency domain: High-frequency noise patterns (screen photos)
    - Color consistency: Skin tone variance (virtual webcams have uniform color)
    - Reflection detection: Specular highlights consistent with 3D face
    |
    v
[Step 5] Confidence Scoring
    - Aggregate scores from steps 2-4
    - Produce final confidence (0.0 - 1.0)
    - Map to verification result:
      - >= 0.85: VERIFIED (high confidence)
      - 0.60 - 0.84: VERIFIED_LOW (verified but flagged)
      - < 0.60: REJECTED (failed verification)
    |
    v
Output: VerificationResult {
    isVerified: boolean,
    confidence: number (0.0-1.0),
    method: "human-v1",
    faceDetected: boolean,
    faceCount: number,
    faceBox: { x, y, width, height },
    qualityScore: number,
    antiSpoofScore: number,
    reasons: string[],  // e.g. ["face_too_small", "low_sharpness"]
    processingTimeMs: number
}
```

### 5.2 @vladmandic/human Configuration

```typescript
// packages/verification/src/human-config.ts

const humanConfig = {
  // Use CPU backend (Vercel serverless has no GPU)
  backend: "tensorflow" as const,
  // Disable unnecessary models to reduce memory and latency
  face: {
    enabled: true,
    detector: {
      enabled: true,
      modelPath: "blazeface-back",  // More accurate than front model
      maxDetected: 5,               // Detect up to 5 faces (we expect 1)
      minConfidence: 0.5,           // Low threshold to catch all faces
      iouThreshold: 0.3,
    },
    mesh: {
      enabled: true,                // Needed for face quality assessment
    },
    iris: {
      enabled: false,               // Not needed
    },
    description: {
      enabled: false,               // We don't need age/gender/emotion
    },
    antispoof: {
      enabled: true,                // Built-in anti-spoofing model
    },
    liveness: {
      enabled: true,                // Built-in liveness detection
    },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
};
```

### 5.3 Quality Metrics (Detailed)

**Face Size Check**:
- Calculate `faceArea = bbox.width * bbox.height`
- Calculate `frameArea = image.width * image.height`
- `faceRatio = faceArea / frameArea`
- PASS if `faceRatio >= 0.15` (face is at least 15% of frame)
- This ensures the face is close enough for meaningful analysis

**Face Position Check**:
- Calculate face center: `cx = bbox.x + bbox.width/2`, `cy = bbox.y + bbox.height/2`
- Define valid zone: x in [15%, 85%], y in [15%, 85%] of frame
- PASS if face center is within valid zone
- Prevents edge cases where face is partially cropped

**Sharpness Check**:
- Extract face region pixels (grayscale)
- Calculate Laplacian variance (measures edge intensity)
- PASS if variance > 100 (empirical threshold)
- Blurry photos from printed images or distant screens fail

**Exposure Check**:
- Calculate mean luminance of face region
- PASS if mean luminance is between 40 and 220 (0-255 scale)
- Too dark (backlit) or too bright (overexposed) fail

### 5.4 Anti-Spoofing Details

**@vladmandic/human built-in anti-spoofing**:
- The library includes `antispoof` and `liveness` models that analyze texture patterns
- `face.antispoof` returns a score (0.0-1.0) where higher = more likely real
- `face.liveness` returns a score (0.0-1.0) where higher = more likely live
- These models are trained on presentation attack datasets (print, screen replay, mask)

**Additional custom checks**:

**Moire Pattern Detection** (printed photos):
- When a photo is taken of a printed image, the camera sensor creates interference patterns (Moire)
- Detection: Apply frequency analysis (FFT) on face region
- Look for periodic peaks at specific frequencies characteristic of print rasters
- Score: 0.0 (definite Moire) to 1.0 (no Moire detected)

**Virtual Webcam Detection**:
- Virtual webcams (ManyCam, OBS Virtual Camera) produce unnaturally consistent frames
- Detection: Check for suspiciously uniform noise patterns
- Real webcams have sensor noise; virtual ones have algorithmic noise or none
- Score: 0.0 (likely virtual) to 1.0 (likely real sensor)

**Screen Replay Detection**:
- Photos of screens have characteristic artifacts (pixel grid, refresh rate banding)
- Detection: Check high-frequency components in face region
- Score: 0.0 (likely screen) to 1.0 (likely direct capture)

### 5.5 Confidence Scoring Formula

```
finalConfidence =
    0.35 * faceDetectionConfidence +     // From blazeface model
    0.25 * antiSpoofScore +               // From human.antispoof model
    0.20 * livenessScore +                // From human.liveness model
    0.10 * qualityScore +                 // Composite of size/position/sharpness/exposure
    0.10 * customAntiSpoofScore           // Moire + virtual webcam + screen replay

Where:
- faceDetectionConfidence: float from blazeface (0.0-1.0)
- antiSpoofScore: float from human.antispoof (0.0-1.0)
- livenessScore: float from human.liveness (0.0-1.0)
- qualityScore: average of (sizeScore, positionScore, sharpnessScore, exposureScore)
- customAntiSpoofScore: average of (moireScore, virtualWebcamScore, screenReplayScore)
```

### 5.6 Verification Result Mapping

| Confidence Range | Result | Label | Badge Color |
|-----------------|--------|-------|-------------|
| >= 0.85 | VERIFIED | "Human Verified" | Green |
| 0.60 - 0.84 | VERIFIED_LOW | "Partially Verified" | Yellow |
| < 0.60 | REJECTED | "Verification Failed" | Red (not shown publicly) |
| null | UNVERIFIED | "Not Verified" | Gray |

---

## 6. Security Posture

**Authentication**:
- All verification endpoints use `accountProcedure` (Clerk auth + account ownership)
- Presigned URLs are scoped to user's folder and expire in 15 minutes
- Verification analysis requires matching accountId

**Anti-Tampering**:
- Client-side detection is for UX only; server-side is authoritative
- Photo hash (SHA-256) stored in VerificationAttestation for tamper detection
- Timestamp binding: verification must occur within 5 minutes of comment submission
- S3 object versioning prevents after-the-fact photo replacement

**Privacy**:
- Photos stored in dedicated S3 folder with restricted access
- Presigned read URLs expire in 1 hour (no permanent public URLs)
- Auto-deletion after configurable retention period (default: 30 days)
- Users can delete verification photos at any time
- No face recognition or identity correlation (detection only, not identification)

**Data Handling**:
- Photos are JPEG, max 500KB, 640x480
- No facial embeddings stored (we store bounding box + scores, not biometric templates)
- GDPR Article 9 consideration: face photos are biometric data when used for identification; our use (existence detection, not identification) may fall under different provisions, but we treat it as sensitive data regardless

---

## Database Schema

### Comment Model Additions

```prisma
model Comment {
  // ... existing fields ...

  // Verification fields (all nullable - existing comments unaffected)
  verificationPhotoS3Key    String?     // S3 key for verification photo
  verificationScore         Float?      // Final confidence score (0.0-1.0)
  verificationMethod        String?     // Algorithm version, e.g. "human-v1"
  verificationTimestamp     DateTime?   // When verification was performed
  isHumanVerified           Boolean?    // Final boolean result (null = not attempted)
  batchVerificationId       String?     // Links batch-submitted comments to same verification

  // Index for verification queries
  @@index([accountId, isHumanVerified])
}
```

### VerificationAttestation Model (New)

```prisma
model VerificationAttestation {
  id                    String    @id @default(uuid())

  // Link to comment(s)
  commentId             String    // Primary comment this verification is for
  batchVerificationId   String?   // If batch, all comments share this ID
  accountId             String    // LinkedIn account
  userId                String    // Clerk user ID

  // Photo reference
  photoS3Key            String    // S3 key for the verification photo
  photoHash             String    // SHA-256 hash of the original photo bytes
  photoSizeBytes        Int       // File size for audit
  photoDimensions       String    // e.g. "640x480"

  // Detection results
  faceDetected          Boolean
  faceCount             Int
  faceBox               Json?     // { x, y, width, height } of primary face
  faceLandmarks         Json?     // Key landmarks (eyes, nose, mouth)

  // Scoring breakdown
  faceDetectionConfidence Float   // blazeface confidence
  antiSpoofScore          Float   // human.antispoof score
  livenessScore           Float   // human.liveness score
  qualityScore            Float   // Composite quality
  customAntiSpoofScore    Float   // Custom checks score
  finalConfidence         Float   // Weighted final score

  // Result
  verificationResult    String    // "VERIFIED" | "VERIFIED_LOW" | "REJECTED"
  reasons               String[]  // Rejection/flag reasons
  processingTimeMs      Int       // Server processing time

  // Client-side detection (for comparison)
  clientFaceDetected    Boolean?  // MediaPipe result from extension
  clientConfidence      Float?    // MediaPipe confidence from extension

  // Metadata
  userAgent             String?   // Browser user agent
  extensionVersion      String?   // Extension version
  capturedAt            DateTime  // When photo was captured (client clock)
  analyzedAt            DateTime  @default(now()) // When server analyzed

  // Retention
  photoExpiresAt        DateTime? // When photo will be auto-deleted
  photoDeleted          Boolean   @default(false) // Whether photo has been deleted

  // Relations
  account               LinkedInAccount @relation(fields: [accountId], references: [id])

  @@index([commentId])
  @@index([batchVerificationId])
  @@index([accountId])
  @@index([userId])
  @@index([photoExpiresAt])
}
```

### VerificationSetting Model (New, per-account)

```prisma
model VerificationSetting {
  accountId               String    @id

  // User preferences
  verificationEnabled     Boolean   @default(true)   // Master toggle
  autoCapture             Boolean   @default(false)   // Auto-capture vs show preview
  showSelfieOnProfile     Boolean   @default(false)   // Show photo on public verification card
  photoRetentionDays      Int       @default(30)      // How long to keep photos

  // Timestamps
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  // Relations
  account                 LinkedInAccount @relation(fields: [accountId], references: [id])
}
```

---

## 7. API Surface (tRPC)

### New Router: `packages/api/src/router/verification.ts`

#### `verification.analyze`

**Auth**: `protectedProcedure`

**Input**:
```typescript
{
  commentId: string,           // Comment to verify
  photoS3Key: string,          // S3 key of uploaded photo
  batchVerificationId?: string, // If part of batch
  clientFaceDetected?: boolean, // MediaPipe result from extension
  clientConfidence?: number,    // MediaPipe confidence
  capturedAt: Date,            // Client-side capture timestamp
  extensionVersion?: string,
}
```

**Output**:
```typescript
{
  isVerified: boolean,
  confidence: number,
  verificationResult: "VERIFIED" | "VERIFIED_LOW" | "REJECTED",
  reasons: string[],
  processingTimeMs: number,
  attestationId: string,
}
```

#### `verification.getSettings`

**Auth**: `accountProcedure`

**Output**: `VerificationSetting`

#### `verification.updateSettings`

**Auth**: `accountProcedure`

**Input**: `Partial<Omit<VerificationSetting, "accountId" | "createdAt" | "updatedAt">>`

**Output**: `VerificationSetting`

#### `verification.deletePhoto`

**Auth**: `protectedProcedure`

**Input**: `{ attestationId: string }`

Deletes photo from S3 and marks attestation as `photoDeleted: true`.

#### `verification.getTrustScore`

**Auth**: `accountProcedure`

**Output**:
```typescript
{
  totalComments: number,
  verifiedComments: number,
  verificationPercentage: number,
  tier: "GOLD" | "SILVER" | "BRONZE" | "UNRANKED",
}
```

### Modified Router: `packages/api/src/router/comment.ts`

#### `comment.saveSubmitted` (Modified)

Add optional verification fields to input:
```typescript
// Additional fields in saveSubmitted input
verificationPhotoS3Key?: string,
verificationScore?: number,
verificationMethod?: string,
isHumanVerified?: boolean,
batchVerificationId?: string,
```

#### `comment.listByAccount` (Modified)

Add verification fields to select:
```typescript
select: {
  // ... existing fields ...
  isHumanVerified: true,
  verificationScore: true,
  verificationTimestamp: true,
  verificationMethod: true,
  // Note: verificationPhotoS3Key NOT included (privacy - only via explicit endpoint)
}
```

---

## 8. Extension Architecture Details

### New Files

```
apps/wxt-extension/
  entrypoints/
    offscreen.html                       # Offscreen document HTML
    offscreen.ts                         # Offscreen document script (camera + MediaPipe)
    linkedin.content/
      stores/
        verification-store.ts            # Verification state (Zustand)
      compose-tab/
        _components/
          CameraPreviewOverlay.tsx        # Camera preview UI in sidebar
        utils/
          capture-verification-photo.ts   # Orchestrates capture flow
          upload-verification-photo.ts    # S3 upload helper
  lib/
    mediapipe/
      face-detection.ts                  # MediaPipe face detection wrapper
```

### Extension Permissions Changes

```typescript
// wxt.config.ts manifest additions
permissions: [
  "activeTab",
  "storage",
  "alarms",
  "tabs",
  "cookies",
  "webRequest",
  "offscreen",          // NEW: Required for offscreen document
],
```

Note: No `camera` permission needed. The `getUserMedia` call happens in the offscreen document which runs on the extension's origin, and the browser will prompt the user for camera access naturally.

### Message Flow (Detailed)

```
Content Script                Background SW              Offscreen Document
     |                             |                           |
     |-- "captureVerification" --> |                           |
     |                             |-- chrome.offscreen.       |
     |                             |   createDocument()        |
     |                             |                           |
     |                             |-- "startCapture" -------> |
     |                             |                           |
     |                             |                      getUserMedia()
     |                             |                      draw to canvas
     |                             |                      canvas.toBlob('image/jpeg', 0.85)
     |                             |                      MediaPipe.detectFaces()
     |                             |                           |
     |                             | <-- "captureResult" ----- |
     |                             |     { blob, faceDetected, |
     |                             |       confidence, box }   |
     |                             |                           |
     |                             |-- chrome.offscreen.       |
     |                             |   closeDocument()         |
     |                             |                           |
     | <-- "captureResult" ------- |                           |
     |                             |                           |
```

### Message Types (New)

```typescript
// apps/wxt-extension/entrypoints/background/background-types.ts additions

export type MessageAction =
  | "getAuthStatus"
  | "getToken"
  | "openTargetListTab"
  | "captureVerification"      // NEW
  | "startCapture"             // NEW (background -> offscreen)
  | "captureResult";           // NEW (offscreen -> background)

export interface CaptureVerificationRequest {
  action: "captureVerification";
  autoCapture?: boolean;  // Skip preview, capture immediately
}

export interface CaptureResult {
  success: boolean;
  blob?: ArrayBuffer;       // JPEG bytes (transferred via structured clone)
  faceDetected?: boolean;
  confidence?: number;
  faceBox?: { x: number; y: number; width: number; height: number };
  error?: string;
}
```

### Verification Store

```typescript
// apps/wxt-extension/entrypoints/linkedin.content/stores/verification-store.ts

interface VerificationState {
  // Current capture state
  isCameraOpen: boolean;
  isCapturing: boolean;
  isUploading: boolean;
  isAnalyzing: boolean;

  // Last capture result
  lastCapture: {
    blob: Blob | null;
    previewUrl: string | null;  // Object URL for preview
    faceDetected: boolean;
    confidence: number;
    faceBox: { x: number; y: number; width: number; height: number } | null;
  } | null;

  // Server verification result
  lastVerificationResult: {
    isVerified: boolean;
    confidence: number;
    verificationResult: string;
    attestationId: string;
  } | null;

  // Batch state
  batchVerificationId: string | null;  // Set when batch capture done
  batchPhotoS3Key: string | null;      // S3 key of batch photo

  // Settings (loaded from DB)
  settings: {
    verificationEnabled: boolean;
    autoCapture: boolean;
    showSelfieOnProfile: boolean;
  } | null;

  // Error state
  error: string | null;
  cameraPermissionDenied: boolean;
}

interface VerificationActions {
  openCamera: () => Promise<void>;
  capturePhoto: () => Promise<CaptureResult>;
  retakePhoto: () => void;
  uploadAndVerify: (commentId: string) => Promise<VerificationResult>;
  setBatchVerification: (batchId: string, s3Key: string) => void;
  clearBatchVerification: () => void;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<VerificationSettings>) => Promise<void>;
  reset: () => void;
}
```

---

## 9. Submit Flow Integration

### Modified Submit Comment Full Flow

The `submitCommentFullFlow` function is modified to insert verification before LinkedIn DOM injection:

```
Current Flow:
1. Insert comment text
2. Tag author (if enabled)
3. Attach image (if enabled)
4. Submit comment (click button)
5. Like post (if enabled)
6. Like own comment (if enabled)
7. Save to database

New Flow:
0. CHECK: Is verification enabled?
   YES: Capture photo (via offscreen doc)
         -> If face detected: proceed
         -> If no face: show "No face detected - retake?"
         -> If camera denied: skip verification, proceed unverified
         -> Upload photo to S3 (parallel with step 1-4)
1. Insert comment text
2. Tag author (if enabled)
3. Attach image (if enabled)
4. Submit comment (click button)
5. Like post (if enabled)
6. Like own comment (if enabled)
7. Save to database (NOW includes verification data)
8. Trigger server-side verification (fire-and-forget)
```

### Modified Batch Submit Flow

```
1. User clicks "Submit All"
2. ONE verification capture (offscreen doc)
3. Upload photo to S3
4. Generate batchVerificationId (ULID)
5. For each card in batch:
   a. Standard submit flow (insert, tag, attach, submit, like)
   b. Save to DB with batchVerificationId + s3Key
6. Trigger ONE server verification (covers all comments in batch)
```

---

## 10. Web App Display

### CommentCard Modifications

Add verification badge to the existing CommentCard component:

```
Before:
[Avatar] Author Name . Caption preview...  [Posted]
Comment text preview...
Touch: 85%  2 hours ago  [View]

After:
[Avatar] Author Name . Caption preview...  [Posted] [Verified checkmark]
Comment text preview...
Touch: 85%  [Verified badge] 2 hours ago  [View]
```

Badge variants:
- Green shield with checkmark: "Human Verified" (confidence >= 0.85)
- Yellow shield: "Partially Verified" (confidence 0.60-0.84)
- No badge: unverified comments (no visual penalty)

### Verification Details (on badge click/hover)

```
Human Verified
Confidence: 92%
Method: human-v1
Verified at: Feb 15, 2026 10:32 AM
[View Photo] (if user enabled showSelfieOnProfile)
```

### Trust Score Section (Account Dashboard)

Add to the existing account dashboard page alongside achievements:

```
Trust Score
-----------
43 of 50 comments verified (86%)
Profile Tier: GOLD

[Gold shield icon]
```

Tier thresholds:
- Gold: >= 90% verified
- Silver: >= 70% verified
- Bronze: >= 50% verified
- Unranked: < 50% or fewer than 10 comments

---

## 11. Data Retention

### Cron Job: Photo Cleanup

**Location**: `apps/nextjs/src/app/api/cron/cleanup-verification-photos/route.ts`

**Schedule**: Daily at 3 AM UTC

**Logic**:
1. Query VerificationAttestation where `photoExpiresAt <= now()` AND `photoDeleted = false`
2. For each: delete from S3, set `photoDeleted = true`
3. Log count of deleted photos

**Default retention**: 30 days (configurable per-user via VerificationSetting.photoRetentionDays)

---

## 12. Privacy and GDPR

### Consent Flow

1. First time user enables verification: show consent dialog explaining:
   - What: webcam photo taken at comment time
   - Why: to prove human presence
   - How long: stored for 30 days (configurable)
   - Rights: can delete anytime, can opt-out
2. Consent stored as `verificationEnabled: true` in VerificationSetting

### Data Subject Rights

- **Right to Access**: User can view all verification photos via settings page
- **Right to Deletion**: "Delete all verification photos" button in settings
- **Right to Portability**: Export verification data as JSON
- **Right to Object**: Disable verification at any time

### Privacy Policy Updates

Add section covering:
- Biometric data handling (face photos)
- Purpose limitation (existence detection, not identification)
- Storage duration and auto-deletion
- Third-party sharing (none - all processing in-house)

---

## 13. Phased Delivery Plan

### Current Status

- Phase 1 (Extension Camera Infrastructure): PLANNED
- Phase 2 (Server-Side Detection Pipeline): PLANNED
- Phase 3 (Upload and Storage): PLANNED
- Phase 4 (Database Schema Changes): PLANNED
- Phase 5 (tRPC API Layer): PLANNED
- Phase 6 (Extension UX Integration): PLANNED
- Phase 7 (Web App Verification Display): PLANNED
- Phase 8 (Settings and Privacy): PLANNED

**Immediate Next Steps**: Phase 1 - Extension Camera Infrastructure

---

## RFCs

### RFC-001: Extension Camera Infrastructure

**Summary**: Set up offscreen document for camera access, MediaPipe face detection, and message passing between content script and offscreen document.

**Dependencies**: None

**Stages**:

**Stage 1: Offscreen Document Setup**
1. Create `apps/wxt-extension/entrypoints/offscreen.html` - minimal HTML with canvas element
2. Create `apps/wxt-extension/entrypoints/offscreen.ts` - script that:
   - Listens for "startCapture" messages from background
   - Calls `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })`
   - Draws frame to hidden canvas
   - Converts canvas to JPEG blob (`canvas.toBlob('image/jpeg', 0.85)`)
   - Sends blob bytes back via `chrome.runtime.sendMessage`
3. Add `"offscreen"` to permissions in `apps/wxt-extension/wxt.config.ts`

**Stage 2: Background Service Worker Message Handling**
1. Add `"captureVerification"` to `MessageAction` type in `apps/wxt-extension/entrypoints/background/background-types.ts`
2. Add `handleCaptureVerification` handler in `apps/wxt-extension/entrypoints/background/message-router.ts`:
   - Creates offscreen document: `chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Camera capture for verification' })`
   - Sends "startCapture" message to offscreen document
   - Waits for "captureResult" response
   - Closes offscreen document: `chrome.offscreen.closeDocument()`
   - Forwards result to content script

**Stage 3: Client-Side Face Detection (MediaPipe)**
1. Install `@mediapipe/tasks-vision` as dependency in `apps/wxt-extension/package.json`
2. Create `apps/wxt-extension/lib/mediapipe/face-detection.ts`:
   - Initialize FaceDetector with WASM runtime
   - `detectFace(imageData: ImageData): { detected: boolean, confidence: number, box: BoundingBox }`
   - Use `FaceDetector` from `@mediapipe/tasks-vision` with `blaze_face_short_range` model
3. Call face detection in offscreen document AFTER capturing frame, BEFORE sending result
4. Copy MediaPipe WASM files to `apps/wxt-extension/public/mediapipe/` for offline access
5. Configure `web_accessible_resources` in manifest to include mediapipe WASM files

**Stage 4: Content Script Integration**
1. Create `apps/wxt-extension/entrypoints/linkedin.content/stores/verification-store.ts` (Zustand store)
2. Implement `captureVerificationPhoto()` function that:
   - Sends `captureVerification` message to background
   - Receives blob + face detection result
   - Stores in verification store
   - Returns result to caller

**Acceptance Criteria**:
- [ ] Offscreen document created and destroyed correctly
- [ ] Camera capture returns JPEG blob (640x480, ~30-50KB)
- [ ] MediaPipe detects face in captured frame (green box overlay)
- [ ] No-face scenario returns `faceDetected: false`
- [ ] Camera permission denial handled gracefully (no crash)
- [ ] Message passing works: content script -> background -> offscreen -> background -> content script
- [ ] Extension loads without errors with new permission

---

### RFC-002: Server-Side Face Detection Pipeline

**Summary**: Create `packages/verification` package with `@vladmandic/human` for face detection, quality analysis, anti-spoofing, and confidence scoring.

**Dependencies**: None (can be developed in parallel with RFC-001)

**Stages**:

**Stage 1: Package Setup**
1. Create `packages/verification/` directory structure:
   ```
   packages/verification/
     package.json
     tsconfig.json
     src/
       index.ts
       human-config.ts
       detection-pipeline.ts
       quality-checks.ts
       anti-spoof-checks.ts
       confidence-scorer.ts
       types.ts
   ```
2. Add to `pnpm-workspace.yaml` if not auto-detected
3. Install dependencies: `@vladmandic/human`, `@tensorflow/tfjs-node` (CPU backend)
4. Configure TypeScript (extend from `tooling/typescript/base.json`)
5. Export from package.json: `"exports": { ".": "./src/index.ts" }`

**Stage 2: Types and Configuration**
1. Create `packages/verification/src/types.ts`:
   - `VerificationInput`: { buffer: Buffer, mimeType: string, capturedAt: Date }
   - `VerificationResult`: { isVerified, confidence, verificationResult, faceDetected, faceCount, faceBox, qualityScore, antiSpoofScore, reasons, processingTimeMs }
   - `QualityMetrics`: { faceSize, facePosition, sharpness, exposure }
   - `AntiSpoofMetrics`: { moireScore, virtualWebcamScore, screenReplayScore, humanAntiSpoofScore, humanLivenessScore }
2. Create `packages/verification/src/human-config.ts`:
   - Export `humanConfig` object (as specified in section 5.2)
   - Export model path constants

**Stage 3: Detection Pipeline Core**
1. Create `packages/verification/src/detection-pipeline.ts`:
   - `class VerificationPipeline`:
     - `private human: Human` (singleton, initialized once)
     - `async initialize(): Promise<void>` - load models on first call
     - `async analyze(input: VerificationInput): Promise<VerificationResult>` - main entry point
   - Initialization strategy: lazy-load on first call, cache instance
   - Image decoding: use `@vladmandic/human`'s built-in image processing (accepts Buffer)

**Stage 4: Quality Checks**
1. Create `packages/verification/src/quality-checks.ts`:
   - `assessFaceSize(faceBox, imageWidth, imageHeight): { score: number, pass: boolean }`
   - `assessFacePosition(faceBox, imageWidth, imageHeight): { score: number, pass: boolean }`
   - `assessSharpness(facePixels: Uint8Array, width: number, height: number): { score: number, pass: boolean }`
   - `assessExposure(facePixels: Uint8Array): { score: number, pass: boolean }`
   - `calculateCompositeQuality(metrics: QualityMetrics): number`

**Stage 5: Anti-Spoofing Checks**
1. Create `packages/verification/src/anti-spoof-checks.ts`:
   - `calculateMoireScore(facePixels, width, height): number` - FFT-based Moire detection
   - `calculateVirtualWebcamScore(imagePixels, width, height): number` - noise pattern analysis
   - `calculateScreenReplayScore(facePixels, width, height): number` - high-frequency artifact detection
   - `calculateCompositeAntiSpoof(builtInScore, livenessScore, customScores): number`

**Stage 6: Confidence Scorer**
1. Create `packages/verification/src/confidence-scorer.ts`:
   - `calculateFinalConfidence(detectionConfidence, antiSpoofScore, livenessScore, qualityScore, customAntiSpoofScore): number`
   - Weighted formula as specified in section 5.5
   - `mapToVerificationResult(confidence: number): "VERIFIED" | "VERIFIED_LOW" | "REJECTED"`
   - `collectReasons(qualityMetrics, antiSpoofMetrics, faceCount): string[]`

**Stage 7: Integration and Testing**
1. Create `packages/verification/src/index.ts` - export VerificationPipeline and types
2. Write unit tests:
   - Test with sample images (include test fixtures):
     - Clear face photo -> VERIFIED
     - No face photo -> REJECTED
     - Multiple faces -> flagged
     - Very small face -> flagged
     - Dark/overexposed -> flagged
   - Test confidence scoring formula
   - Test quality metric calculations
   - Test anti-spoof score calculations
3. Integration test: full pipeline end-to-end

**Acceptance Criteria**:
- [ ] Package compiles and exports correctly
- [ ] `@vladmandic/human` loads models successfully on Node.js
- [ ] Face detection correctly identifies faces in test images
- [ ] Quality checks produce meaningful scores for various image conditions
- [ ] Anti-spoof checks flag printed photos and screen replays
- [ ] Confidence scorer produces expected results for known inputs
- [ ] Pipeline processes a 640x480 JPEG in under 2 seconds
- [ ] Type safety throughout (no `any` types)
- [ ] Unit tests pass

---

### RFC-003: Upload and Storage

**Summary**: Configure S3 storage for verification photos, create presigned URL flow, implement data retention.

**Dependencies**: RFC-002 (types from verification package)

**Stages**:

**Stage 1: S3 Configuration**
1. Define S3 folder structure: `verification-photos/{userId}/{timestamp}-{random}.jpg`
2. Reuse existing `S3BucketService` from `packages/s3/src/index.ts`
3. Add method `generateVerificationKey(userId: string): string` to S3BucketService
4. Ensure bucket CORS allows PUT from extension origin

**Stage 2: Presigned URL for Verification Photos**
1. The existing `s3Upload.getUploadUrl` router already supports folder-based uploads
2. Extension will call `s3Upload.getUploadUrl` with `folder: "verification-photos"` and `contentType: "image/jpeg"`
3. No new endpoint needed (reuse existing infrastructure)

**Stage 3: Upload Helper in Extension**
1. Create `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/upload-verification-photo.ts`:
   - `uploadVerificationPhoto(blob: Blob): Promise<{ s3Key: string, s3Url: string }>`
   - Gets presigned URL via tRPC `s3Upload.getUploadUrl`
   - PUTs JPEG blob to presigned URL
   - Returns s3Key and s3Url

**Stage 4: Data Retention Cron**
1. Create `apps/nextjs/src/app/api/cron/cleanup-verification-photos/route.ts`:
   - GET handler (Vercel Cron)
   - Verify CRON_SECRET header
   - Query expired attestations: `photoExpiresAt <= now() AND photoDeleted = false`
   - Delete from S3 using S3BucketService.deleteFile()
   - Mark attestation as `photoDeleted = true`
   - Return count of cleaned up photos
2. Add cron schedule to `vercel.json`: daily at 3:00 AM UTC

**Acceptance Criteria**:
- [ ] Extension can get presigned URL for verification photo upload
- [ ] Extension can upload JPEG blob to S3 via presigned URL
- [ ] Uploaded photo accessible via S3 URL (with presigned read URL)
- [ ] Cron job deletes expired photos correctly
- [ ] S3 folder structure is `verification-photos/{userId}/{timestamp}-{random}.jpg`

---

### RFC-004: Database Schema Changes

**Summary**: Add verification fields to Comment model, create VerificationAttestation and VerificationSetting models, run migration.

**Dependencies**: None (can be developed in parallel)

**Stages**:

**Stage 1: Comment Model Updates**
1. Edit `packages/db/prisma/models/comment.prisma`:
   - Add `verificationPhotoS3Key String?`
   - Add `verificationScore Float?`
   - Add `verificationMethod String?`
   - Add `verificationTimestamp DateTime?`
   - Add `isHumanVerified Boolean?`
   - Add `batchVerificationId String?`
   - Add `@@index([accountId, isHumanVerified])`

**Stage 2: VerificationAttestation Model**
1. Create `packages/db/prisma/models/verification-attestation.prisma`
2. Define model with all fields as specified in Database Schema section
3. Add relation to LinkedInAccount

**Stage 3: VerificationSetting Model**
1. Create `packages/db/prisma/models/verification-setting.prisma`
2. Define model with all fields as specified in Database Schema section
3. Add relation to LinkedInAccount

**Stage 4: LinkedInAccount Relation Updates**
1. Edit `packages/db/prisma/models/linkedin-account.prisma`:
   - Add `verificationAttestations VerificationAttestation[]`
   - Add `verificationSetting VerificationSetting?`

**Stage 5: Migration**
1. Run `pnpm db:generate` to generate Prisma client
2. Run `pnpm db:push` to apply schema to database (or `db:migrate dev` for migration file)
3. Verify migration applied cleanly
4. Verify existing Comment data is unaffected (all new fields nullable)

**Acceptance Criteria**:
- [ ] Migration applies without errors
- [ ] Existing Comment records retain all data (no breaking changes)
- [ ] New Comment fields are nullable (default null)
- [ ] VerificationAttestation model queryable
- [ ] VerificationSetting model queryable
- [ ] Relations work correctly (LinkedInAccount -> VerificationAttestation)
- [ ] Prisma client types include new fields
- [ ] Index on `[accountId, isHumanVerified]` created

---

### RFC-005: tRPC API Layer

**Summary**: Create verification tRPC router and modify comment router to include verification data.

**Dependencies**: RFC-002 (verification package), RFC-004 (database schema)

**Stages**:

**Stage 1: Verification Router**
1. Create `packages/api/src/router/verification.ts`:
   - Import VerificationPipeline from `@sassy/verification`
   - Create singleton pipeline instance (lazy-initialized)
2. Implement `verification.analyze` procedure:
   - Input: commentId, photoS3Key, batchVerificationId?, clientFaceDetected?, clientConfidence?, capturedAt, extensionVersion?
   - Download photo from S3 using S3BucketService
   - Run VerificationPipeline.analyze()
   - Create VerificationAttestation record
   - Update Comment record with verification results
   - Return verification result
3. Implement `verification.getSettings` procedure:
   - Use accountProcedure
   - Return VerificationSetting for active account (create default if not exists)
4. Implement `verification.updateSettings` procedure:
   - Use accountProcedure
   - Upsert VerificationSetting
5. Implement `verification.deletePhoto` procedure:
   - Use protectedProcedure
   - Verify user owns the attestation
   - Delete from S3
   - Mark attestation as photoDeleted
6. Implement `verification.getTrustScore` procedure:
   - Use accountProcedure
   - Count total POSTED comments for account
   - Count verified comments (isHumanVerified === true)
   - Calculate percentage and tier

**Stage 2: Register Router**
1. Import verificationRouter in `packages/api/src/router/root.ts`
2. Add to appRouter: `verification: verificationRouter()`

**Stage 3: Modify Comment Router**
1. Edit `packages/api/src/router/comment.ts`:
   - Add verification fields to `saveSubmitted` input schema (all optional)
   - Store verification fields in Comment create
   - Add verification fields to `listByAccount` select

**Stage 4: S3 Download Helper**
1. Add `getFileBuffer(key: string): Promise<Buffer>` method to S3BucketService in `packages/s3/src/index.ts`
2. Uses `GetObjectCommand` to download file as buffer

**Acceptance Criteria**:
- [ ] `verification.analyze` processes photo and returns result
- [ ] `verification.getSettings` returns default settings for new accounts
- [ ] `verification.updateSettings` persists setting changes
- [ ] `verification.deletePhoto` removes photo from S3 and updates attestation
- [ ] `verification.getTrustScore` calculates correct percentage and tier
- [ ] `comment.saveSubmitted` accepts and stores verification fields
- [ ] `comment.listByAccount` returns verification status fields
- [ ] Router registered in root.ts
- [ ] All procedures use correct auth middleware

---

### RFC-006: Extension UX Integration

**Summary**: Modify the submit flow to integrate verification capture, build camera preview overlay, handle batch submit, add settings UI.

**Dependencies**: RFC-001 (camera infrastructure), RFC-003 (upload), RFC-005 (API)

**Stages**:

**Stage 1: Modify Submit Comment Flow**
1. Edit `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/submit-comment-full-flow.ts`:
   - At the top of the function, check verification settings from verification store
   - If verification enabled:
     a. Call `captureVerificationPhoto()` from verification store
     b. If face detected: upload photo in background, proceed with submit
     c. If no face: show notification "No face detected", allow retry or skip
     d. If camera denied: skip verification, proceed unverified
   - Pass verification data (s3Key, batchVerificationId) to `saveCommentToDb()`
   - After saveCommentToDb, trigger `verification.analyze` (fire-and-forget)

**Stage 2: Modify Save Comment to DB**
1. Edit `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/save-comment-to-db.ts`:
   - Accept optional verification fields in SaveCommentOptions:
     ```
     verificationPhotoS3Key?: string
     batchVerificationId?: string
     ```
   - Pass to `trpc.comment.saveSubmitted.mutate()`

**Stage 3: Camera Preview Overlay Component**
1. Create `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/_components/CameraPreviewOverlay.tsx`:
   - Small overlay (200x150px) in bottom-right corner of sidebar
   - Shows live camera preview (via offscreen document stream - or captured frame preview)
   - Green bounding box around detected face
   - "Verify & Submit" button (enabled when face detected)
   - "Skip" button (submits without verification)
   - "Retake" button (capture new frame)
   - Red indicator when no face detected

**Stage 4: Batch Submit Integration**
1. Modify batch submit logic in compose tab:
   - Before batch starts: single capture
   - Generate `batchVerificationId` (ULID)
   - Upload photo once
   - Pass s3Key + batchVerificationId to each card's `saveCommentToDb()`
   - Trigger single `verification.analyze` after batch completes

**Stage 5: Settings UI**
1. Create verification settings section in the extension's settings/account tab:
   - Toggle: "Enable webcam verification" (verificationEnabled)
   - Toggle: "Auto-capture on submit" vs "Show preview first" (autoCapture)
   - Toggle: "Show photo on public profile" (showSelfieOnProfile)
   - Info text explaining what verification does

**Stage 6: Verification Store Integration**
1. Load verification settings on account auth (similar to settings-db-store pattern)
2. Add to `initSettingsDBStoreListener` or create separate listener
3. Integrate with compose-store for batch tracking

**Acceptance Criteria**:
- [ ] Single comment: Submit triggers camera -> preview -> verify & submit
- [ ] Single comment: No face detected shows retry/skip options
- [ ] Single comment: Camera denied skips verification gracefully
- [ ] Batch submit: Single capture covers all comments
- [ ] Auto-capture mode: captures immediately without preview (for returning users)
- [ ] Verification data saved to database with comment
- [ ] Server-side analysis triggered after save
- [ ] Settings toggles persist to database
- [ ] No regression in submit flow timing (verification happens in parallel where possible)

---

### RFC-007: Web App Verification Display

**Summary**: Add verification badges to history page, create verification details panel, build trust score display and profile tiers.

**Dependencies**: RFC-005 (API returns verification data)

**Stages**:

**Stage 1: CommentCard Badge**
1. Edit `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/CommentCard.tsx`:
   - Import `ShieldCheck` icon from lucide-react
   - Add `isHumanVerified` and `verificationScore` to HistoryComment type
   - After the "Posted" badge, conditionally render verification badge:
     - `isHumanVerified === true && verificationScore >= 0.85`: Green `ShieldCheck` + "Verified"
     - `isHumanVerified === true && verificationScore < 0.85`: Yellow `ShieldCheck` + "Partial"
     - `isHumanVerified === null || isHumanVerified === false`: no badge
   - Add tooltip on badge hover with confidence percentage

**Stage 2: Update History Types**
1. Edit `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/types.ts`:
   - Add to HistoryComment:
     ```
     isHumanVerified: boolean | null
     verificationScore: number | null
     verificationTimestamp: Date | null
     verificationMethod: string | null
     ```

**Stage 3: PostPreviewSidebar Verification Details**
1. Edit `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/PostPreviewSidebar.tsx`:
   - Add verification section below existing comment details:
     - Shield icon with verification status
     - Confidence percentage
     - Verification timestamp
     - Method version
   - If user has `showSelfieOnProfile` enabled: show thumbnail of verification photo

**Stage 4: Trust Score Widget**
1. Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/_components/TrustScoreCard.tsx`:
   - Query `verification.getTrustScore` via tRPC
   - Display: "X of Y comments verified (Z%)"
   - Display tier badge: Gold/Silver/Bronze shield
   - Progress bar showing verification percentage
   - Tier thresholds: Gold >= 90%, Silver >= 70%, Bronze >= 50%, Unranked < 50%
2. Add TrustScoreCard to account dashboard page

**Acceptance Criteria**:
- [ ] Verified comments show green shield badge on history page
- [ ] Partially verified comments show yellow shield badge
- [ ] Unverified comments show no badge (no visual penalty)
- [ ] Badge tooltip shows confidence percentage
- [ ] PostPreviewSidebar shows verification details section
- [ ] Trust score widget displays on account dashboard
- [ ] Profile tier (Gold/Silver/Bronze) calculated correctly
- [ ] Tier badge renders with appropriate color

---

### RFC-008: Settings and Privacy

**Summary**: Implement user consent flow, data controls, GDPR compliance features.

**Dependencies**: RFC-005 (settings API), RFC-007 (web display)

**Stages**:

**Stage 1: Consent Dialog**
1. Create consent dialog component in extension sidebar:
   - Triggered on first verification attempt
   - Explains: what data is captured, how it's used, how long it's stored
   - "I Understand" button enables verification
   - "No Thanks" button disables verification (can re-enable in settings)
   - Store consent state in VerificationSetting.verificationEnabled

**Stage 2: Data Controls (Web Dashboard)**
1. Create verification settings section in web dashboard settings page:
   - "Delete All Verification Photos" button
     - Calls `verification.deleteAllPhotos` (batch delete from S3)
     - Sets all attestations to `photoDeleted: true`
     - Does NOT delete verification scores/results (keeps audit trail)
   - "Export Verification Data" button
     - Downloads JSON with all attestation records (minus photo URLs)
   - "Disable Verification" toggle
     - Sets `verificationEnabled: false`
     - Future comments will be unverified
   - Photo retention slider (7 / 14 / 30 / 60 / 90 days)

**Stage 3: Privacy Safeguards**
1. Ensure presigned read URLs for photos expire in 1 hour
2. Ensure verification photo URLs are NEVER included in listByAccount response
3. Photos only accessible via explicit `verification.getPhotoUrl` endpoint with user auth
4. Add `photoExpiresAt` calculation on attestation creation: `now() + photoRetentionDays`

**Stage 4: API Additions**
1. Add `verification.deleteAllPhotos` procedure (accountProcedure)
2. Add `verification.exportData` procedure (accountProcedure) - returns attestation records as JSON
3. Add `verification.getPhotoUrl` procedure (protectedProcedure) - generates temporary presigned read URL

**Acceptance Criteria**:
- [ ] Consent dialog appears on first verification attempt
- [ ] User can delete all verification photos
- [ ] User can export verification data as JSON
- [ ] User can disable verification globally
- [ ] Photo retention is configurable
- [ ] Photos are auto-deleted after retention period
- [ ] Photo URLs never leak in list responses
- [ ] Presigned read URLs expire in 1 hour

---

## Testing Strategy

### Unit Tests
- `packages/verification/`: Detection pipeline, quality checks, anti-spoof checks, confidence scorer
- Extension: Message passing mocks, verification store actions
- API: Verification router procedures with mock DB

### Integration Tests
- Full pipeline: capture photo -> upload to S3 -> analyze -> store result
- Comment submission with verification data
- Batch verification flow

### Manual Testing Scenarios
1. Happy path: face detected, verified, badge appears
2. No face: camera shows nothing, retake prompt
3. Camera denied: graceful degradation, comment still works
4. Batch submit: single capture, all comments verified
5. Settings: enable/disable verification, auto-capture toggle
6. Privacy: delete photos, export data
7. Spoofing: test with printed photo (should score lower)
8. Trust score: verify tier calculation with various comment mixes

### Performance Testing
- Cold start for `@vladmandic/human` on Vercel serverless
- Photo upload latency (S3 presigned URL)
- Total time added to submit flow
- Impact on extension bundle size (MediaPipe WASM)

---

## Future Enhancements

### V2 (Post-Launch)
- **Liveness detection**: Head turn challenge (turn left, right) for higher confidence
- **Environment attestation**: Capture browser window hash + screen state
- **Multi-frame capture**: 3-5 frames for temporal consistency check
- **Video verification**: 3-second video clip instead of single photo

### V3 (Long-term)
- **Blockchain attestation**: Write verification hash to blockchain for immutable proof
- **Cross-device correlation**: Consistent verification across devices
- **Organization-level verification policies**: Admin can require verification
- **API for third parties**: Let other tools query verification status
- **Mobile verification**: When Expo app is built, add face verification

---

## Implementation Checklist (Complete Workflow)

### Phase 1: Extension Camera Infrastructure (RFC-001) - ~6 hours
- [ ] 1.1 Create `apps/wxt-extension/entrypoints/offscreen.html` with canvas element
- [ ] 1.2 Create `apps/wxt-extension/entrypoints/offscreen.ts` with getUserMedia, canvas capture, blob conversion
- [ ] 1.3 Add `"offscreen"` to permissions in `apps/wxt-extension/wxt.config.ts`
- [ ] 1.4 Add `CaptureVerificationRequest` and `CaptureResult` types to `apps/wxt-extension/entrypoints/background/background-types.ts`
- [ ] 1.5 Add `"captureVerification"` handler to `apps/wxt-extension/entrypoints/background/message-router.ts`
- [ ] 1.6 Install `@mediapipe/tasks-vision` in `apps/wxt-extension/package.json`
- [ ] 1.7 Create `apps/wxt-extension/lib/mediapipe/face-detection.ts` with FaceDetector wrapper
- [ ] 1.8 Integrate MediaPipe face detection in offscreen.ts (detect after capture)
- [ ] 1.9 Copy MediaPipe WASM files to `apps/wxt-extension/public/mediapipe/`
- [ ] 1.10 Update `web_accessible_resources` in `wxt.config.ts` for mediapipe files
- [ ] 1.11 Create `apps/wxt-extension/entrypoints/linkedin.content/stores/verification-store.ts`
- [ ] 1.12 Create `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/capture-verification-photo.ts`
- [ ] 1.13 Test: offscreen document opens camera, captures frame, detects face, returns result

### Phase 2: Server-Side Detection Pipeline (RFC-002) - ~8 hours
- [ ] 2.1 Create `packages/verification/` directory structure (package.json, tsconfig.json, src/)
- [ ] 2.2 Install `@vladmandic/human` and `@tensorflow/tfjs-node` dependencies
- [ ] 2.3 Create `packages/verification/src/types.ts` with all type definitions
- [ ] 2.4 Create `packages/verification/src/human-config.ts` with model configuration
- [ ] 2.5 Create `packages/verification/src/quality-checks.ts` with face size, position, sharpness, exposure assessments
- [ ] 2.6 Create `packages/verification/src/anti-spoof-checks.ts` with Moire, virtual webcam, screen replay detection
- [ ] 2.7 Create `packages/verification/src/confidence-scorer.ts` with weighted formula and result mapping
- [ ] 2.8 Create `packages/verification/src/detection-pipeline.ts` with VerificationPipeline class
- [ ] 2.9 Create `packages/verification/src/index.ts` exporting pipeline and types
- [ ] 2.10 Write unit tests for quality checks
- [ ] 2.11 Write unit tests for anti-spoof checks
- [ ] 2.12 Write unit tests for confidence scorer
- [ ] 2.13 Write integration test for full pipeline with sample images
- [ ] 2.14 Verify pipeline runs on Node.js (CPU backend) in under 2 seconds

### Phase 3: Upload and Storage (RFC-003) - ~3 hours
- [ ] 3.1 Add `generateVerificationKey(userId: string): string` method to `packages/s3/src/index.ts`
- [ ] 3.2 Add `getFileBuffer(key: string): Promise<Buffer>` method to `packages/s3/src/index.ts` (for server-side download)
- [ ] 3.3 Create `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/upload-verification-photo.ts`
- [ ] 3.4 Create `apps/nextjs/src/app/api/cron/cleanup-verification-photos/route.ts`
- [ ] 3.5 Add cron schedule to `vercel.json` for daily cleanup
- [ ] 3.6 Test: extension uploads JPEG to S3, cron deletes expired photos

### Phase 4: Database Schema Changes (RFC-004) - ~2 hours
- [ ] 4.1 Add verification fields to `packages/db/prisma/models/comment.prisma`
- [ ] 4.2 Add `@@index([accountId, isHumanVerified])` to Comment model
- [ ] 4.3 Create `packages/db/prisma/models/verification-attestation.prisma`
- [ ] 4.4 Create `packages/db/prisma/models/verification-setting.prisma`
- [ ] 4.5 Add relations to `packages/db/prisma/models/linkedin-account.prisma`
- [ ] 4.6 Run `pnpm db:generate` to regenerate Prisma client
- [ ] 4.7 Run `pnpm db:push` to apply schema changes
- [ ] 4.8 Verify existing Comment data is unaffected

### Phase 5: tRPC API Layer (RFC-005) - ~5 hours
- [ ] 5.1 Create `packages/api/src/router/verification.ts` with all procedures
- [ ] 5.2 Implement `verification.analyze` (download from S3, run pipeline, store result)
- [ ] 5.3 Implement `verification.getSettings` (return or create default)
- [ ] 5.4 Implement `verification.updateSettings` (upsert)
- [ ] 5.5 Implement `verification.deletePhoto` (S3 delete + mark attestation)
- [ ] 5.6 Implement `verification.getTrustScore` (count + calculate tier)
- [ ] 5.7 Register verification router in `packages/api/src/router/root.ts`
- [ ] 5.8 Modify `comment.saveSubmitted` input to accept verification fields in `packages/api/src/router/comment.ts`
- [ ] 5.9 Modify `comment.listByAccount` select to include verification fields
- [ ] 5.10 Test: full round-trip from extension to server and back

### Phase 6: Extension UX Integration (RFC-006) - ~8 hours
- [ ] 6.1 Modify `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/submit-comment-full-flow.ts` to integrate verification
- [ ] 6.2 Modify `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/save-comment-to-db.ts` to accept verification fields
- [ ] 6.3 Create `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/_components/CameraPreviewOverlay.tsx`
- [ ] 6.4 Implement batch submit verification (single capture for all cards)
- [ ] 6.5 Create verification settings section in extension settings/account tab
- [ ] 6.6 Initialize verification store with account auth listener
- [ ] 6.7 Handle camera permission denial (show notification, skip verification)
- [ ] 6.8 Handle no-face-detected scenario (retry/skip UI)
- [ ] 6.9 Test: single submit with verification
- [ ] 6.10 Test: batch submit with single verification
- [ ] 6.11 Test: camera denied graceful degradation
- [ ] 6.12 Test: settings persistence

### Phase 7: Web App Verification Display (RFC-007) - ~5 hours
- [ ] 7.1 Update `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/types.ts` with verification fields
- [ ] 7.2 Add verification badge to `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/CommentCard.tsx`
- [ ] 7.3 Add verification details section to `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/_components/PostPreviewSidebar.tsx`
- [ ] 7.4 Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/_components/TrustScoreCard.tsx`
- [ ] 7.5 Add TrustScoreCard to account dashboard page
- [ ] 7.6 Test: badges display correctly for verified/unverified comments
- [ ] 7.7 Test: trust score and tier calculation

### Phase 8: Settings and Privacy (RFC-008) - ~4 hours
- [ ] 8.1 Create consent dialog component for first-time verification
- [ ] 8.2 Add verification settings section to web dashboard settings
- [ ] 8.3 Implement "Delete All Verification Photos" button
- [ ] 8.4 Implement "Export Verification Data" button
- [ ] 8.5 Add `verification.deleteAllPhotos` procedure
- [ ] 8.6 Add `verification.exportData` procedure
- [ ] 8.7 Add `verification.getPhotoUrl` procedure (presigned read URL)
- [ ] 8.8 Set `photoExpiresAt` on attestation creation
- [ ] 8.9 Verify photo URLs never leak in list responses
- [ ] 8.10 Test: consent flow, delete photos, export data, retention

**Total Estimated Time**: 41-45 hours (5-6 days)

---

## Cursor + RIPER-5 Guidance

### RIPER-5 Mode
1. **RESEARCH**: Completed (codebase analysis, architecture review)
2. **INNOVATE**: Completed (Approach 2 selected: Server-Verified Snapshot)
3. **PLAN**: YOU ARE HERE - this document is the output
4. **EXECUTE**: Request user approval, then enter EXECUTE mode
5. **REVIEW**: After implementation, validate against this plan

### EXECUTE Mode Instructions
- Implement EXACTLY as planned in RFCs
- Start with RFC-001 and RFC-002 in parallel (no dependencies between them)
- RFC-003 and RFC-004 can also run in parallel
- RFC-005 depends on RFC-002 and RFC-004
- RFC-006 depends on RFC-001, RFC-003, and RFC-005
- RFC-007 depends on RFC-005
- RFC-008 depends on RFC-005 and RFC-007
- Mid-implementation check-in after Phase 4 (database schema ready)

### Dependency Graph

```
RFC-001 (Extension Camera) ----+
                               |
RFC-002 (Server Detection) -+  +---> RFC-006 (Extension UX)
                             |  |
RFC-003 (Upload/Storage) ---+--+
                             |
RFC-004 (Database Schema) --+---> RFC-005 (tRPC API) --+--> RFC-007 (Web Display) --> RFC-008 (Privacy)
```

**Optimal execution order** (with parallelism):
1. RFC-001 + RFC-002 + RFC-004 (parallel)
2. RFC-003 (after RFC-002 types are available)
3. RFC-005 (after RFC-002 and RFC-004)
4. RFC-006 (after RFC-001, RFC-003, RFC-005)
5. RFC-007 (after RFC-005)
6. RFC-008 (after RFC-005, RFC-007)

---

**Next Step**: Review this plan, approve for execution, then enter EXECUTE mode with `ENTER EXECUTE MODE` command.
