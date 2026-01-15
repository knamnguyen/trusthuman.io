# Stripe Quantity Pricing Migration Plan

**Created:** 19-12-25
**Status:** Planning
**Type:** Refactor - Pricing Model Migration

---

## Overview

Migrate from tiered volume-based pricing to flat quantity-based pricing across the Stripe integration.

**Old Pricing (Tiered):**

- Monthly: $24.99 (1), $21.99 (2-9), $18.99 (10-24), $16.99 (25+)
- Yearly: $249 (1), $199 (2-9), $179 (10-24), $159 (25+)

**New Pricing (Flat Quantity):**

- Monthly: $24.99 per slot (any quantity)
- Yearly: $249 per slot (any quantity)

**Scope:**

- Rename all "tiered" terminology to "quantity"
- Replace complex tier calculations with simple multiplication
- Update Stripe products/prices config
- Simplify import script
- Update schemas, utilities, service methods, and tRPC endpoints

**Safe to Delete:**

- Old tiered products/prices are DEV ONLY
- No production customers affected

---

## Implementation Checklist

### Phase 1: Asset & Script Updates

- [ ] **1.1** Create new `packages/stripe/assets/quantity-products-config.json`
  - Replace tiered config with flat per_unit pricing
  - Monthly: $24.99 per unit
  - Yearly: $249 per unit
  - Use `billing_scheme: "per_unit"` instead of `"tiered"`
  - Remove tier arrays, use single unit_amount

- [ ] **1.2** Rename `packages/stripe/scripts/importTieredProducts.ts` → `importQuantityProducts.ts`
  - Update CONFIG_FILE path to `quantity-products-config.json`
  - Replace `createTieredPrice()` with `createPerUnitPrice()`
  - Remove tier formatting logic
  - Simplify to create standard recurring prices
  - Update script metadata: `importScript: "importQuantityProducts.ts"`

- [ ] **1.3** Update `packages/stripe/package.json` scripts
  - Rename `stripe:tiered` → `stripe:quantity`
  - Rename `stripe:tiered:dry-run` → `stripe:quantity:dry-run`
  - Update script paths to use `importQuantityProducts.ts`

- [ ] **1.4** Delete old config (AFTER new one works)
  - Remove `packages/stripe/assets/tiered-products-config.json`

---

### Phase 2: Schema & Validators

- [ ] **2.1** Update `packages/stripe/src/schema-validators.ts`
  - Rename enum: `STRIPE_TIERED_PRODUCTS` → `STRIPE_QUANTITY_PRODUCTS`
  - Rename enum: `STRIPE_TIERED_PRICES` → `STRIPE_QUANTITY_PRICES`
  - Update product IDs: `prod_tiered_*` → `prod_quantity_*`
  - Update placeholder price IDs (will be replaced after import)
  - Remove `TIERED_PRICING_CONFIG` constant entirely
  - Create simplified `QUANTITY_PRICING_CONFIG`:
    ```ts
    export const QUANTITY_PRICING_CONFIG = {
      monthly: { pricePerSlot: 24.99 },
      yearly: { pricePerSlot: 249 },
    } as const;
    ```
  - Rename schema: `createTieredCheckoutSchema` → `createQuantityCheckoutSchema`
  - Keep validation: `z.number().int().min(1).max(24)` for numSeats
  - Keep `updateSubscriptionQuantitySchema` as-is (already correct)
  - Keep `changeSubscriptionCycleSchema` as-is (already correct)

---

### Phase 3: Utility Functions

- [ ] **3.1** Refactor `packages/stripe/src/utils.ts`
  - **DELETE** `calculateTieredMonthlyPrice()` - no longer needed
  - **DELETE** `calculateTieredYearlyPrice()` - no longer needed
  - **DELETE** `getTierName()` - no longer needed
  - **DELETE** `getTieredPricingBreakdown()` - replace with simpler version
  - **CREATE** `getQuantityPricingBreakdown()`:

    ```ts
    export function getQuantityPricingBreakdown(
      numSlots: number,
      billingCycle: "MONTHLY" | "YEARLY",
    ) {
      const isYearly = billingCycle === "YEARLY";
      const pricePerSlot = isYearly
        ? QUANTITY_PRICING_CONFIG.yearly.pricePerSlot
        : QUANTITY_PRICING_CONFIG.monthly.pricePerSlot;

      const totalPrice = numSlots * pricePerSlot;
      const monthlyEquivalent = isYearly ? totalPrice / 12 : totalPrice;
      const yearlyTotal = isYearly ? totalPrice : totalPrice * 12;

      // Yearly savings calculation
      const monthlyAnnualCost =
        numSlots * QUANTITY_PRICING_CONFIG.monthly.pricePerSlot * 12;
      const yearlyCost = numSlots * QUANTITY_PRICING_CONFIG.yearly.pricePerSlot;
      const savings = monthlyAnnualCost - yearlyCost;
      const savingsPercent = ((savings / monthlyAnnualCost) * 100).toFixed(1);

      return {
        numSlots,
        billingCycle,
        pricePerSlot,
        totalPrice,
        monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
        yearlyTotal: Math.round(yearlyTotal * 100) / 100,
        savings: isYearly ? savings : 0,
        savingsPercent: isYearly ? savingsPercent : "0",
      };
    }
    ```

---

### Phase 4: StripeService Methods

- [ ] **4.1** Update `packages/stripe/src/index.ts`
  - Update imports:
    - `STRIPE_TIERED_PRICES` → `STRIPE_QUANTITY_PRICES`
    - `getTieredPricingBreakdown` → `getQuantityPricingBreakdown`
  - Rename method: `getPricingPreviewTiered()` → `getPricingPreviewQuantity()`
    - Update parameter names: `numSeats` → `numSlots`
    - Update function calls to use `getQuantityPricingBreakdown()`
  - Rename method: `createCheckoutSessionTiered()` → `createCheckoutSessionQuantity()`
    - Update parameter names: `numSeats` → `numSlots`
    - Update price ID references to `STRIPE_QUANTITY_PRICES`
    - Update success URL query param: `seats` → `slots`
    - Update metadata: `numSeats` → `numSlots`, remove `tierName`
    - Update function calls to use `getQuantityPricingBreakdown()`
  - Rename method: `getSubscriptionDetailsTiered()` → `getSubscriptionDetailsQuantity()`
    - Update return type: `numSeats` → `numSlots`
    - Update variable names throughout
    - Update function calls to use `getQuantityPricingBreakdown()`
  - Update JSDoc comments: replace "tiered" with "quantity-based"

---

### Phase 5: tRPC Router

- [ ] **5.1** Update `packages/api/src/router/stripe.ts`
  - Update imports:
    - `createTieredCheckoutSchema` → `createQuantityCheckoutSchema`
  - Rename endpoint: `createCheckoutTiered` → `createCheckoutQuantity`
    - Update input schema reference
    - Update service method call: `createCheckoutSessionTiered()` → `createCheckoutSessionQuantity()`
    - Update variable names: `numSeats` → `numSlots`
  - Rename endpoint: `getSubscriptionTiered` → `getSubscriptionQuantity`
    - Update service method call: `getSubscriptionDetailsTiered()` → `getSubscriptionDetailsQuantity()`
  - Rename endpoint: `getPricingPreview` (keep name, update internals)
    - Update input schema reference
    - Update service method call: `getPricingPreviewTiered()` → `getPricingPreviewQuantity()`
    - Update variable names: `numSeats` → `numSlots`
  - Update JSDoc comments: replace "tiered" with "quantity-based"

---

## Testing Checklist

- [ ] Run `pnpm stripe:quantity --dry-run` - verify script output
- [ ] Run `pnpm stripe:quantity` - create products/prices in Stripe test mode
- [ ] Copy new price IDs to `STRIPE_QUANTITY_PRICES` enum
- [ ] Test `api.stripe.getPricingPreview` - verify flat pricing calculation
- [ ] Test `api.stripe.createCheckoutQuantity` - verify checkout session creation
- [ ] Test `api.stripe.getSubscriptionQuantity` - verify subscription details retrieval
- [ ] Verify no TypeScript errors across packages
- [ ] Verify old "tiered" terminology completely removed (grep check)

---

## Rollout Steps

1. **Development Testing:**
   - Run import script in test mode
   - Update price IDs in schema-validators
   - Test all endpoints via tRPC

2. **Cleanup:**
   - Delete `tiered-products-config.json`
   - Remove old import script (or rename as backup)
   - Update any frontend references (future work)

3. **Production (When Ready):**
   - Run `pnpm stripe:quantity --production`
   - Update production environment variables if needed
   - Monitor Stripe dashboard for new subscriptions

---

## Risks & Mitigations

**Risk:** Breaking existing dev subscriptions
**Mitigation:** DEV only, safe to recreate

**Risk:** Missing frontend references to old endpoints
**Mitigation:** Grep for "Tiered" across entire codebase, update all references

**Risk:** Type mismatches after rename
**Mitigation:** TypeScript will catch at compile time, update all call sites

---

## Success Criteria

- [ ] All "tiered" terminology replaced with "quantity"
- [ ] Simple flat pricing: `totalPrice = numSlots × pricePerSlot`
- [ ] Stripe products/prices created successfully
- [ ] All tRPC endpoints working with new naming
- [ ] TypeScript compiles without errors
- [ ] No references to old tiered system remain

---

## Notes

- **Naming Convention:** Slots (not seats) aligns with multi-tenant design doc
- **Calculation Simplicity:** No tier lookups, just multiplication
- **Stripe Billing Scheme:** Changed from "tiered" to standard recurring per_unit
- **Backwards Compatibility:** Not needed (DEV environment only)

---

**Status Markers:**

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Phase 5 Complete
- [ ] Testing Complete
- [ ] Implementation Complete
