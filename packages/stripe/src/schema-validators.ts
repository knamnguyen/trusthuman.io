import z from "zod";

export enum STRIPE_ID_PRICES {
  WEEKLY = "price_1RgO4IIeOImcBhu6i3t8slGo",
  MONTHLY = "price_1RgO2AIeOImcBhu6rV6M9PmD",
  YEARLY = "price_1RgO29IeOImcBhu6KnZqFvZK",
}

export enum STRIPE_ID_PRODUCTS {
  WEEKLY = "prod_SbbGTzwkeyTyPY",
  MONTHLY = "prod_RxVyOOcNMLC1Sk",
  YEARLY = "prod_RxWTt3Py1f7gvF",
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
