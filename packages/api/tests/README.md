# Stripe Webhook Integration Tests

Complete test suite for Stripe webhook events and payment flows.

## 📋 Test Coverage

| Test File | Tests | Events Covered |
|-----------|-------|----------------|
| [WEBHOOK_TEST_MATRIX.md](./WEBHOOK_TEST_MATRIX.md) | **Test Matrix** | All scenarios documented |
| [webhook-quantity-changes.test.ts](./webhook-quantity-changes.test.ts) | 7 tests | `customer.subscription.updated` (quantity) |
| [webhook-initial-subscription.test.ts](./webhook-initial-subscription.test.ts) | 7 tests | `checkout.session.completed`, `customer.subscription.created` |
| [webhook-plan-changes.test.ts](./webhook-plan-changes.test.ts) | 5 tests | `customer.subscription.updated` (plan) |
| [webhook-cancellations.test.ts](./webhook-cancellations.test.ts) | 8 tests | `customer.subscription.deleted`, `customer.subscription.paused` |
| [webhook-edge-cases.test.ts](./webhook-edge-cases.test.ts) | 8 tests | Error handling, `customer.deleted` |

**Total: 35 integration tests covering 6 webhook events**

---

## 🚀 Setup

### Prerequisites

1. **API server running at localhost:8000**
   ```bash
   # Terminal 1: Start your API server
   bun run dev
   ```

2. **Cloudflare tunnel active**
   ```bash
   # Verify api-dev.engagekit.io → localhost:8000
   curl https://api-dev.engagekit.io/health
   ```

3. **Environment variables**
   ```bash
   # .env
   STRIPE_SECRET_KEY=sk_test_...  # Must be test mode
   STRIPE_WEBHOOK_SECRET=whsec_...
   DATABASE_URL=postgresql://...  # Dev DB
   ```

---

## 🧪 Running Tests

### Run all webhook tests
```bash
bun test packages/api/tests/webhook-*.test.ts
```

### Run specific test file
```bash
# Most critical (catches customer portal bug)
bun test packages/api/tests/webhook-quantity-changes.test.ts

# Initial subscriptions
bun test packages/api/tests/webhook-initial-subscription.test.ts

# Plan changes (monthly ↔ yearly)
bun test packages/api/tests/webhook-plan-changes.test.ts

# Cancellations & grace periods
bun test packages/api/tests/webhook-cancellations.test.ts

# Edge cases & error handling
bun test packages/api/tests/webhook-edge-cases.test.ts
```

### Watch mode (for development)
```bash
bun test --watch packages/api/tests/webhook-quantity-changes.test.ts
```

### Run specific test
```bash
bun test packages/api/tests/webhook-quantity-changes.test.ts -t "2.4"
```

---

## 👀 Debugging

**Watch server logs in real-time** (Terminal 2):
```bash
# You'll see:
# - Webhook events arriving at /api/webhooks/stripe
# - Processing logs from webhook handler
# - Success/error messages
# - "✅ customer.subscription.updated: Org xyz updated to N slots"
```

**Common error patterns to watch for:**
- `"Missing organizationId or payerId in metadata, skipping"`
- `"Missing current_period_end, skipping"`
- `"Subscription ID mismatch, skipping"`

---

## 🐛 Expected Failures

### Test 2.4: Customer Portal Downgrade Bug ⚠️

This test is **expected to FAIL** until the bug is fixed:

```bash
bun test packages/api/tests/webhook-quantity-changes.test.ts -t "2.4"
```

**Expected behavior:**
- User downgrades from customer portal (5→2 slots)
- DB should NOT update (deferred to renewal)
- `purchasedSlots` should stay 5

**Current bug:**
- DB updates immediately to 2 slots (incorrect!)
- Downgrade applied mid-period instead of being deferred

**Root cause (in [stripe.webhook.ts:103-135](packages/api/src/api/webhooks/stripe.webhook.ts#L103-L135)):**
```typescript
const isDowngrade = slots < org.purchasedSlots;
const periodAdvanced = newExpiresAt >= org.subscriptionExpiresAt;

if (isDowngrade && periodAdvanced) {
  // Apply downgrade at renewal
  await applyPendingDowngrade(...);
} else {
  // BUG: Mid-period downgrades fall through here!
  await convertOrgSubscriptionToPremium(...); // ← Applies immediately
}
```

**Fix needed:**
- Detect mid-period downgrades (isDowngrade=true, periodAdvanced=false)
- Skip DB update for mid-period downgrades
- Only apply at renewal (periodAdvanced=true)

---

## 🧹 Cleanup

Tests automatically clean up after themselves:
- ✅ Delete Stripe subscriptions
- ✅ Delete Stripe customers
- ✅ Delete test organizations
- ✅ Delete test users

**Test data is prefixed** for easy identification:
- Users: `test-wh-user-{scenario}-{timestamp}`
- Orgs: `test-wh-org-{scenario}-{timestamp}`
- Emails: `test-wh-user-{scenario}-{timestamp}@test.local`

If tests fail mid-run, you may need to manually clean up:
```sql
-- Check for leftover test data
SELECT * FROM users WHERE id LIKE 'test-wh-%';
SELECT * FROM organizations WHERE id LIKE 'test-wh-%';
```

---

## 📊 Test Results

After running tests, you should see:

```
✅ webhook-quantity-changes.test.ts (7 tests)
✅ webhook-initial-subscription.test.ts (7 tests)
✅ webhook-plan-changes.test.ts (5 tests)
✅ webhook-cancellations.test.ts (8 tests)
✅ webhook-edge-cases.test.ts (8 tests)

Total: 35 passed (except test 2.4 - expected failure)
```

---

## 🎯 Next Steps

1. **Run test 2.4 to confirm the bug**
   ```bash
   bun test packages/api/tests/webhook-quantity-changes.test.ts -t "2.4"
   ```

2. **Watch server logs to see what's happening**

3. **Fix the downgrade logic in webhook handler**

4. **Re-run test 2.4 to verify fix**

5. **Run full test suite**
   ```bash
   bun test packages/api/tests/webhook-*.test.ts
   ```

---

## 📝 Notes

- Tests use **real Stripe test mode** - no mocking
- Tests use **dev database** - safe with proper cleanup
- Each test waits 3 seconds for webhooks (configurable via `WEBHOOK_DELAY`)
- Tests are **idempotent** - safe to run multiple times
- Tests use **unique timestamps** - no conflicts between runs

---

## 🆘 Troubleshooting

### Tests failing with "STRIPE_SECRET_KEY must be test mode"
- Ensure `STRIPE_SECRET_KEY` starts with `sk_test_`

### Tests timing out
- Verify API server is running at localhost:8000
- Verify Cloudflare tunnel is active
- Check webhook logs for errors

### Tests leaving data in DB
- Check test cleanup runs (afterAll hooks)
- Manually clean up with SQL queries above

### Webhooks not arriving
- Verify `api-dev.engagekit.io` resolves correctly
- Check webhook endpoint exists: `/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` is correct

---

For detailed scenario documentation, see [WEBHOOK_TEST_MATRIX.md](./WEBHOOK_TEST_MATRIX.md).
