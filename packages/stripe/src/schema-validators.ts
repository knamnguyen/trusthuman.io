import z from "zod";

export enum STRIPE_ID_PRICES {
  WEEKLY = "price_1Rgu3rIeOImcBhu69gt6ATT5",
  MONTHLY = "price_1Rgu3tIeOImcBhu6hGtPbqkx",
  YEARLY = "price_1Rgu3vIeOImcBhu6Xy4JW0ue",
}

export enum STRIPE_ID_PRODUCTS {
  WEEKLY = "prod_Sc8KmHeAXogWmV",
  MONTHLY = "prod_Sc8KDu938GBww2",
  YEARLY = "prod_Sc8KT6PYPewOkS",
}

//createCheckoutSchema
export const createCheckoutSchema = z.object({
  purchaseType: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
  endorsely_referral: z.string().optional().nullable(),
});

export const createCustomerPortalSchema = z.object({
  returnUrl: z.string().optional(),
});

// Mapping from Stripe product/price IDs to AccessType
export const STRIPE_ID_TO_ACCESS_TYPE: Record<
  string,
  "FREE" | "WEEKLY" | "MONTHLY" | "YEARLY"
> = {
  // Product IDs
  [STRIPE_ID_PRODUCTS.WEEKLY]: "WEEKLY",
  [STRIPE_ID_PRODUCTS.MONTHLY]: "MONTHLY",
  [STRIPE_ID_PRODUCTS.YEARLY]: "YEARLY",
  // Price IDs
  [STRIPE_ID_PRICES.WEEKLY]: "WEEKLY",
  [STRIPE_ID_PRICES.MONTHLY]: "MONTHLY",
  [STRIPE_ID_PRICES.YEARLY]: "YEARLY",
};

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
export enum STRIPE_QUANTITY_PRICES {
  MONTHLY = "price_1SfwifIeOImcBhu6UuKoAjXp",
  YEARLY = "price_1SfwigIeOImcBhu6o7PnYLCy",
}

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
  monthly: { pricePerSlot: 24.99 },
  yearly: { pricePerSlot: 249 },
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
