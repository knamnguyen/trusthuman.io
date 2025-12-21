// packages/stripe/src/index.ts
import Stripe from "stripe";

import { STRIPE_ID_PRICES, STRIPE_QUANTITY_PRICES } from "./schema-validators";
import { getQuantityPricingBreakdown } from "./utils";

/**
 * Configuration options for Stripe service
 */
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

/**
 * Result of handleWebhookEvent
 */
export interface WebhookResult {
  received: boolean;
  event?: Stripe.Event;
  clerkUserId?: string;
}

/**
 * Stripe service for handling payments and subscriptions
 * This implementation uses Stripe as the single source of truth
 * for subscription status, eliminating the need for a database table
 */
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(config: StripeConfig) {
    // Initialize Stripe with API key
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2023-08-16", // Use a stable version
    });
    this.webhookSecret = config.webhookSecret;
  }

  async createCheckoutSession(
    clerkUserId: string,
    purchaseType: "WEEKLY" | "MONTHLY" | "YEARLY",
    email?: string,
    endorsely_referral?: string | null,
  ): Promise<{ url: string | null }> {
    // Get or create a Stripe customer with Clerk ID in metadata
    const customerId = await this.getOrCreateCustomer(clerkUserId, email);

    // const mode = purchaseType === "LIFETIME" ? "payment" : "subscription";
    const mode = "subscription";

    // Generate URLs based on environment
    const baseUrl =
      process.env.NEXTJS_URL ?? `http://localhost:${process.env.PORT}`;
    const successUrl = `${baseUrl}/subscription?success=true`;
    const cancelUrl = `${baseUrl}/subscription?canceled=true`;

    // Create a checkout session with the base config plus mode-specific additions

    const sessionConfig = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_ID_PRICES[purchaseType],
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        clerkUserId,
        purchaseType,
        endorsely_referral,
      },
    } as Stripe.Checkout.SessionCreateParams;

    const session = await this.stripe.checkout.sessions.create(sessionConfig);

    //return url to redirect to stripe checkout
    return { url: session.url };
  }

  /**
   * Create a customer portal session for subscription management
   *
   * @param clerkUserId - The user's Clerk ID
   * @param returnUrl - URL to return to after customer is done in the portal
   * @returns URL to redirect user to Stripe customer portal
   */
  async createCustomerPortalSession(
    clerkUserId: string,
    returnUrl: string = process.env.NEXTJS_URL ?? "",
  ): Promise<{ url: string | null }> {
    try {
      // Find customer by Clerk ID
      const customerId = await this.findCustomerByClerkId(clerkUserId);

      if (!customerId) {
        throw new Error("Customer not found");
      }

      // Create customer portal session
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      return { url: null };
    }
  }

  /**
   * Find a Stripe customer by Clerk ID
   *
   * @param clerkUserId - The user's Clerk ID
   * @returns Stripe customer ID if found
   */
  private async findCustomerByClerkId(
    clerkUserId: string,
  ): Promise<string | null> {
    // Search for customers with standard API
    const customers = await this.stripe.customers.list({
      limit: 100, // List more customers to increase chance of finding
    });

    // Manually filter for the clerkUserId in metadata
    const customer = customers.data.find(
      (cust) => cust.metadata.clerkUserId === clerkUserId,
    );

    if (customer) {
      return customer.id;
    }

    return null;
  }

  /**
   * Get or create a Stripe customer for a Clerk user
   *
   * @param clerkUserId - The user's Clerk ID
   * @param email - User's email address
   * @returns Stripe customer ID
   */
  private async getOrCreateCustomer(
    clerkUserId: string,
    email?: string,
  ): Promise<string> {
    // Check if customer already exists
    const existingCustomerId = await this.findCustomerByClerkId(clerkUserId);

    if (existingCustomerId) {
      return existingCustomerId;
    }

    // Create new customer with Clerk ID in metadata
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        clerkUserId, // This is key for finding customers later
      },
    });

    return customer.id;
  }

  /**
   * Handle Stripe webhook event
   * @param signature Stripe signature from headers
   * @param body Raw request body as Buffer
   * @returns WebhookResult with event and clerkUserId
   */
  async handleWebhookEvent(
    signature: string,
    body: Buffer,
  ): Promise<WebhookResult> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      );
      // Try to extract clerkUserId from event metadata (if present)
      let clerkUserId: string | undefined = undefined;
      if (event.data?.object?.metadata?.clerkUserId) {
        clerkUserId = event.data.object.metadata.clerkUserId;
      } else if (event.data?.object?.customer) {
        // Optionally, fetch the customer to get metadata
        const customerId = event.data.object.customer;
        try {
          const customer = await this.stripe.customers.retrieve(customerId);
          if (typeof customer === "object" && customer.metadata?.clerkUserId) {
            clerkUserId = customer.metadata.clerkUserId;
          }
        } catch (e) {
          // ignore
        }
      }
      return { received: true, event, clerkUserId };
    } catch (error) {
      return { received: false };
    }
  }

  // ============================================================================
  // QUANTITY PRICING METHODS (Multi-Account)
  // ============================================================================
  //
  // These methods support multi-account subscriptions with quantity-based pricing:
  // - Monthly: $24.99/slot/mo (1-24 slots)
  // - Yearly:  $249/slot/yr (1-24 slots, save 17%)
  // - Enterprise (25+): Contact sales
  //
  // For plan changes (add slots, switch billing cycle), use the existing
  // createCustomerPortalSession() method - Stripe Portal handles it automatically.
  // ============================================================================

  /**
   * Get pricing preview for a given slot count (no Stripe API call needed)
   *
   * @param numSlots - Number of slots to price
   * @param billingCycle - "MONTHLY" or "YEARLY"
   * @returns Pricing breakdown
   */
  getPricingPreviewQuantity(
    numSlots: number,
    billingCycle: "MONTHLY" | "YEARLY",
  ): ReturnType<typeof getQuantityPricingBreakdown> {
    if (numSlots < 1 || numSlots > 24) {
      throw new Error(
        "Slot count must be between 1 and 24. Contact sales for 25+ slots.",
      );
    }
    return getQuantityPricingBreakdown(numSlots, billingCycle);
  }

  /**
   * Create a checkout session for quantity-based (multi-account) pricing
   *
   * @param clerkUserId - The user's Clerk ID
   * @param numSlots - Number of slots (1-24)
   * @param billingCycle - "MONTHLY" or "YEARLY"
   * @param email - User's email address
   * @returns Checkout URL and pricing breakdown
   */
  async createCheckoutSessionQuantity(
    clerkUserId: string,
    numSlots: number,
    billingCycle: "MONTHLY" | "YEARLY",
    email?: string,
  ): Promise<{
    url: string | null;
    pricing: ReturnType<typeof getQuantityPricingBreakdown>;
  }> {
    // Validate slot count
    if (numSlots < 1 || numSlots > 24) {
      throw new Error(
        "Slot count must be between 1 and 24. Contact sales for 25+ slots.",
      );
    }

    // Get or create a Stripe customer with Clerk ID in metadata
    const customerId = await this.getOrCreateCustomer(clerkUserId, email);

    // Get the appropriate price ID based on billing cycle
    const priceId =
      billingCycle === "YEARLY"
        ? STRIPE_QUANTITY_PRICES.YEARLY
        : STRIPE_QUANTITY_PRICES.MONTHLY;

    // Generate URLs based on environment
    const baseUrl =
      process.env.NEXTJS_URL ?? `http://localhost:${process.env.PORT}`;
    const successUrl = `${baseUrl}/subscription?success=true&slots=${numSlots}`;
    const cancelUrl = `${baseUrl}/subscription?canceled=true`;

    // Get pricing breakdown for response
    const pricing = getQuantityPricingBreakdown(numSlots, billingCycle);

    // Create a checkout session with quantity-based pricing
    // The `quantity` field determines how many slots - Stripe applies per-unit pricing automatically
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: numSlots,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          clerkUserId,
          numSlots: String(numSlots),
          billingCycle,
        },
      },
      metadata: {
        clerkUserId,
        numSlots: String(numSlots),
        billingCycle,
        pricingType: "quantity",
      },
    };

    const session = await this.stripe.checkout.sessions.create(sessionConfig);

    return { url: session.url, pricing };
  }

  /**
   * Get current quantity-based subscription details
   *
   * @param clerkUserId - The user's Clerk ID
   * @returns Subscription details including slot count and pricing
   */
  async getSubscriptionDetailsQuantity(clerkUserId: string): Promise<{
    hasSubscription: boolean;
    subscriptionId: string | null;
    status: string | null;
    numSlots: number;
    billingCycle: "MONTHLY" | "YEARLY" | null;
    pricing: ReturnType<typeof getQuantityPricingBreakdown> | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }> {
    // Find customer
    const customerId = await this.findCustomerByClerkId(clerkUserId);
    if (!customerId) {
      return {
        hasSubscription: false,
        subscriptionId: null,
        status: null,
        numSlots: 0,
        billingCycle: null,
        pricing: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Get active subscription
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return {
        hasSubscription: false,
        subscriptionId: null,
        status: null,
        numSlots: 0,
        billingCycle: null,
        pricing: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const subscription = subscriptions.data[0]!;
    const subscriptionItem = subscription.items.data[0];

    const numSlots = subscriptionItem?.quantity ?? 1;
    const billingCycle =
      subscriptionItem?.price.recurring?.interval === "year"
        ? "YEARLY"
        : "MONTHLY";

    const pricing = getQuantityPricingBreakdown(numSlots, billingCycle);

    return {
      hasSubscription: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      numSlots,
      billingCycle,
      pricing,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }
}
