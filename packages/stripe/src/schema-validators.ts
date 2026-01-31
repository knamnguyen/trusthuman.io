import z from "zod";

export const createCustomerPortalSchema = z.object({
  returnUrl: z.string().optional(),
});

// ============================================================================
// QUANTITY PRICING (Multi-Account)
// ============================================================================

/**
 * Quantity product IDs - these are created by running:
 * pnpm stripe:quantity --production
 *
 * IMPORTANT: After running the script, update these values with
 * the actual Stripe product IDs from the output.
 */
export enum STRIPE_QUANTITY_PRODUCTS {
  // Placeholder values - replace after running import script
  MONTHLY = "prod_quantity_monthly",
  YEARLY = "prod_quantity_yearly",
}

/**
 * Quantity price IDs - these are created by running:
 * pnpm stripe:quantity --production
 *
 * IMPORTANT: After running the script, update these values with
 * the actual Stripe price IDs from the output.
 */
export const STRIPE_QUANTITY_PRICES = {
  MONTHLY:
    process.env.NODE_ENV === "production"
      ? "price_1SfwifIeOImcBhu6UuKoAjXp"
      : "price_1SucpbIeOImcBhu6h87mFCaa",
  YEARLY:
    process.env.NODE_ENV === "production"
      ? "price_1SfwigIeOImcBhu6o7PnYLCy"
      : "price_1SucpcIeOImcBhu6IM5hqKzE",
};

/**
 * Quantity pricing configuration
 *
 * Pricing:
 * - Monthly: $24.99/slot/mo (1-24 slots)
 * - Yearly:  $249/slot/yr (1-24 slots, save 17%)
 * - Enterprise (25+): Contact sales
 */
export const QUANTITY_PRICING_CONFIG = {
  maxSlots: 24,
  monthly: { pricePerSlot: 29.99 },
  yearly: { pricePerSlot: 299.99 },
} as const;

// Zod schema for quantity checkout
export const createQuantityCheckoutSchema = z.object({
  numSlots: z.number().int().min(1).max(24),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
});

// Zod schema for updating subscription quantity
export const updateSubscriptionQuantitySchema = z.object({
  newQuantity: z.number().int().min(1).max(24),
});

// Zod schema for changing billing cycle
export const changeSubscriptionCycleSchema = z.object({
  newCycle: z.enum(["MONTHLY", "YEARLY"]),
});

export const checkoutSessionMetadataSchema = z.union([
  z.object({
    type: z.literal("create_subscription"),
    organizationId: z.string(),
    payerId: z.string(),
    slots: z.string(),
    endorsely_referral: z.string().nullable(),
  }),
  z.object({
    type: z.literal("update_subscription"),
    organizationId: z.string(),
    payerId: z.string(),
    slots: z.string(),
    endorsely_referral: z.string().nullable(),
  }),
]);

export type CheckoutSessionMetadata = z.infer<
  typeof checkoutSessionMetadataSchema
>;

export const subscriptionMetadataSchema = z.object({
  organizationId: z.string(),
  payerId: z.string(),
  organizationName: z.string().optional(),
});

export type SubscriptionMetadata = z.infer<typeof subscriptionMetadataSchema>;
