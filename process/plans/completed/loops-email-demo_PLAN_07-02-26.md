# Loops Email Demo - Quick Client Preview

**Date**: February 7, 2026
**Complexity**: SIMPLE (one-session implementation)
**Status**: ✅ COMPLETED - Demo successful, client approved

## Quick Links
- [Overview](#overview)
- [Execution Brief](#execution-brief)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Overview

Quick demo to show client how weekly analytics email looks visually. This is a **minimal proof-of-concept** - no database, no scheduling, no data syncing. Just: extension data → test button → Loops email → inbox.

**Purpose**: Preview email template design with real LinkedIn analytics data

---

## 2. Goals and Success Metrics

**Goals**:
- Client can see email design with real metrics
- Validate visual layout before full implementation
- Quick turnaround (1-2 hours max)

**Success Metrics**:
- Test email button works
- Email received in inbox
- All 6 metrics display correctly
- Visual design looks professional

---

## 3. Execution Brief

### Phase 1: Environment & Loops Setup
**What happens:** Add Loops API key to `.env`, create email template in Loops dashboard with 6 metric cards, get template ID.

**Test:** Loops API key accessible in app, template visible in dashboard, template ID copied.

### Phase 2: Backend - Simple tRPC Mutation
**What happens:** Create `sendTestAnalyticsEmail` mutation that takes 6 metrics as input, calls Loops transactional API directly (no database), sends to current user's email.

**Test:** API endpoint callable via tRPC, accepts metric inputs, successfully sends email via Loops.

### Phase 3: Frontend - Test Button in Extension
**What happens:** Add "Send Test Email" button to analytics tab, read current analytics data from `chrome.storage.local`, call tRPC mutation on click, show loading/success/error states.

**Test:** Button visible in analytics tab, clicking triggers email send, loading state appears, success toast shown, email received.

### Expected Outcome
- Functional test email button in extension
- Email arrives in inbox with 6 metrics displayed
- Client can see visual design and provide feedback
- No database persistence (data comes directly from extension)

---

## 4. Scope

### In Scope
✅ Loops API integration (transactional email)
✅ Email template with 6 metric cards
✅ Test button in analytics tab
✅ Read data from chrome.storage.local
✅ Send to current user only
✅ Basic error handling

### Out of Scope
❌ Database tables (no persistence)
❌ DBOS workflows (no scheduling)
❌ Data syncing logic
❌ Weekly aggregation
❌ Multi-user distribution
❌ Webhook unsubscribe
❌ Email preference management
❌ Chart generation (can add later)

---

## 5. Assumptions and Constraints

**Assumptions**:
- Loops account already exists
- Analytics data already stored in `chrome.storage.local`
- User is logged in (has auth context)
- Extension already has tRPC setup

**Constraints**:
- Must complete in 1-2 hours
- No database changes allowed (demo only)
- Template design may need iteration based on client feedback

---

## 6. Functional Requirements

1. **Environment Setup**
   - Add `LOOPS_API_KEY` to `.env`
   - Verify API key works

2. **Loops Email Template**
   - Create template in Loops dashboard
   - 6 metric cards: followers, invites, comments, contentReach, profileViews, engageReach
   - Simple card layout (2x3 grid)
   - Optional: percentage change indicators
   - Get template ID for API calls

3. **tRPC Mutation**
   - Endpoint: `sendTestAnalyticsEmail`
   - Input: 6 metrics (numbers)
   - Call Loops transactional API
   - Send to `ctx.user.email`
   - Return success/failure

4. **Extension UI**
   - Button in analytics tab: "📧 Send Test Email"
   - Loading state: "Sending..."
   - Success toast: "Test email sent! Check your inbox."
   - Error toast: "Failed to send email"

---

## 7. Non-Functional Requirements

- **Performance**: Email sends in <3 seconds
- **Reliability**: Show clear error if Loops API fails
- **UX**: Button disabled during send (prevent double-click)
- **Security**: API key stored in server env (not exposed to client)

---

## 8. Acceptance Criteria

- [ ] Loops API key configured in `.env`
- [ ] Email template created in Loops dashboard
- [ ] Template ID obtained and used in code
- [ ] tRPC mutation created and tested
- [ ] Button visible in analytics tab
- [ ] Clicking button reads data from chrome.storage.local
- [ ] Email sends successfully via Loops API
- [ ] Loading state shows during send
- [ ] Success toast appears after send
- [ ] Test email received in inbox
- [ ] All 6 metrics display correctly in email
- [ ] Email design looks professional

---

## 9. Implementation Checklist

**Phase 1: Environment & Loops Setup** (30-45 min)
- [x] Add `LOOPS_API_KEY` to `.env` file
- [x] Add to `.env.example` for documentation
- [x] Log into Loops dashboard
- [x] Navigate to Templates → Create New Transactional Template
- [x] Design email with 6 metric cards (HTML/visual editor)
- [x] Add data variables: `followers`, `invites`, `comments`, `contentReach`, `profileViews`, `engageReach`
- [x] Preview template with sample data
- [x] Publish template
- [x] Copy template ID from dashboard
- [ ] Test API connection with curl (optional sanity check)

**Phase 2: Backend - tRPC Mutation** (15-20 min)
- [x] Locate analytics tRPC router file
- [x] Create `sendTestAnalyticsEmail` mutation
- [x] Add input schema with Zod (6 metrics)
- [x] Implement Loops API call (fetch transactional endpoint)
- [x] Use template ID from step 1
- [x] Pass `ctx.user.email` as recipient
- [x] Map input data to template variables
- [x] Add error handling (try/catch)
- [x] Return success response
- [x] Added LOOPS_API_KEY to env schema
- [x] Registered analytics router in root router
- [ ] Test mutation via tRPC playground (if available)

**Phase 3: Extension UI - Test Button** (20-30 min)
- [x] Locate analytics tab component in WXT extension
- [x] Import tRPC mutation hook
- [x] Add state via mutation hook (isPending)
- [x] Create `handleSendTestEmail` function
- [x] Read analytics data from existing hooks (profileViewsLatest, etc.)
- [x] Call mutation with extracted metrics
- [x] Handle loading state via mutation.isPending
- [x] Handle success (show toast via onSuccess)
- [x] Handle error (show error toast via onError)
- [x] Add button to UI with Mail icon
- [x] Disable button when mutation.isPending
- [x] Show "Sending..." text when loading
- [ ] Test button click flow

**Phase 4: End-to-End Testing** (15-30 min)
- [x] Open extension on LinkedIn
- [x] Verify analytics data exists in chrome.storage.local
- [x] Click "Send Test Email" button
- [x] Verify loading state appears
- [x] Verify success toast appears
- [x] Check inbox for email
- [x] Verify all 6 metrics display correctly
- [x] Check email renders well on desktop
- [ ] Check email renders well on mobile (Gmail app) - NOT TESTED
- [ ] Test error case (invalid API key, simulate failure) - NOT TESTED
- [x] Fix any visual issues in Loops template
- [x] Demo successful, client approved

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Loops API key invalid | High | Test with curl first, verify in dashboard |
| Analytics data not in chrome.storage | High | Check storage structure, use mock data if needed |
| Email lands in spam | Medium | Use verified sender domain in Loops |
| Template design doesn't match expectations | Medium | Quick iteration, easy to update in dashboard |
| tRPC not set up in extension | High | Verify existing tRPC calls work first |

---

## 11. Integration Notes

**Dependencies**:
- Loops account and API key
- Existing tRPC setup in extension
- Analytics data structure in chrome.storage.local
- User authentication (need `ctx.user.email`)

**Files to Modify**:
- `.env` - Add Loops API key
- `apps/nextjs/src/server/api/routers/analytics.ts` - Add mutation (or create new router)
- `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx` - Add button

**Environment Variables**:
```bash
LOOPS_API_KEY=your_loops_api_key_here
```

**Actual Data Structure (DISCOVERED)**:
Data comes from custom hooks in AnalyticsTab.tsx, NOT direct chrome.storage access:

```typescript
// 6 Metrics available:
const metrics = {
  profileViews: profileViewsLatest?.data.totalViews ?? 0,
  invites: inviteCountLatest?.data.totalInvites ?? 0,
  comments: commentsLatest?.data.totalComments ?? 0,
  followers: followersLatest?.data.totalFollowers ?? 0,
  engageReach: profileImpressionsLatest?.data.totalImpressions ?? 0, // "Engage Reach" in UI
  contentReach: contentImpressionsLatest?.data.totalImpressions ?? 0, // "Content Reach" in UI
};

// Percentage changes already calculated!
const changes = {
  profileViewsChange: percentageChanges.profileViews,
  invitesChange: percentageChanges.inviteCount,
  commentsChange: percentageChanges.comments,
  followersChange: percentageChanges.followers,
  engageReachChange: percentageChanges.profileImpressions,
  contentReachChange: percentageChanges.contentImpressions,
};
```

**Storage keys** (managed by WXT storage, not directly accessed):
- `local:profile-views-${accountId}`
- `local:invite-count-${accountId}`
- `local:dashboard-comments-${accountId}`
- `local:followers-count-${accountId}`
- `local:profile-impressions-${accountId}`
- `local:content-impressions-${accountId}`

---

## 12. Cursor + RIPER-5 Guidance

**Cursor Plan Mode**:
- Import Implementation Checklist directly
- Execute sequentially (4 phases)
- After each phase, verify with tests
- Keep demo scope tight (resist feature creep)

**RIPER-5 Fast Mode**:
- This is a simple demo, can use FAST MODE
- Phases: RESEARCH (find files) → INNOVATE (skip, approach is clear) → PLAN (this doc) → EXECUTE (implement)
- After execution, gather client feedback
- If approved, use learnings for full implementation (main plan)

**Note**: This is a throwaway demo. After client approval, implement proper version using `weekly-analytics-email_PLAN_07-02-26.md` (with database, scheduling, etc.)

---

## Demo Results & Key Learnings

✅ **DEMO SUCCESSFUL** - Client approved visual design and email delivery

### Technical Learnings for Full Implementation

1. **Loops Integration Verified**
   - Template ID: `cmlc5hhdz1ebf0i25hqomb3zf`
   - Loops auto-detects data variables from template
   - Transactional API response time: ~1-2 seconds
   - Email delivery confirmed working

2. **tRPC Pattern for Extension**
   - ✅ CORRECT: Use `getTrpcClient()` directly inside async functions
   - ❌ WRONG: Don't use React hooks (`.useMutation()`) in extension content scripts
   - Reference file: `apps/wxt-extension/entrypoints/linkedin.content/stores/settings-db-store.ts`

3. **Analytics Data Structure Confirmed**
   - 6 metrics available via custom hooks (not direct chrome.storage access)
   - Data source: `useProfileViewsHistory()`, `useInviteCountHistory()`, etc.
   - Percentage changes already calculated and available
   - All data accessible from `AnalyticsTab.tsx` component

4. **Files Created**
   - `packages/api/src/router/analytics.ts` - New analytics router with `sendTestAnalyticsEmail` mutation
   - Added to `packages/api/src/router/root.ts`
   - `LOOPS_API_KEY` added to env schema

5. **Files Modified**
   - `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx` - Added test email button
   - `.env` - Added Loops API key
   - `.env.example` - Documented Loops API key

### Recommendations for Full Implementation

1. **Reuse Loops Template** - Current template design approved, use same template ID for full implementation
2. **Reuse Analytics Router** - Extend existing `analytics.ts` router with new mutations
3. **Follow getTrpcClient() Pattern** - All extension mutations should use this pattern
4. **Email Frequency** - Weekly delivery confirmed as appropriate (not too frequent)
5. **Metrics Display** - All 6 metrics are relevant and clear

### Next Phase: Full Implementation

Ready to proceed with `weekly-analytics-email_PLAN_07-02-26.md`:
1. Phase 1-3: Database schema (LinkedInAnalyticsDaily table)
2. Phase 4-6: Extension auto-sync (research chrome.storage patterns first)
3. Phase 7-8: DBOS workflow (scheduled cron job)
4. Phase 9: Loops integration (extend demo mutation)
5. Phase 10: Testing & QA
