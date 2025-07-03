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
