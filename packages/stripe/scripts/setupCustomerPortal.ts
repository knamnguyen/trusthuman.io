#!/usr/bin/env tsx
/**
 * Setup Stripe Customer Portal Configuration
 *
 * This script creates and configures the Stripe Customer Portal
 * with the necessary settings for subscription management.
 */
import Stripe from "stripe";

import { StripeConfig, StripeService } from "../src/index";

// Load environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error("Error: STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn(
    "Warning: STRIPE_WEBHOOK_SECRET environment variable is not set. Webhook handling will not work.",
  );
}

// Initialize Stripe service
const stripeConfig: StripeConfig = {
  secretKey: STRIPE_SECRET_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET || "",
};

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: "2023-08-16",
});

/**
 * Create customer portal configuration
 */
async function setupCustomerPortal(): Promise<void> {
  try {
    console.log("🔧 Setting up Stripe Customer Portal configuration...");

    // Check if a configuration already exists
    const existingConfigs = await stripe.billingPortal.configurations.list({
      limit: 1,
    });

    if (existingConfigs.data.length > 0) {
      console.log("✅ Customer Portal configuration already exists:");
      console.log(`   Configuration ID: ${existingConfigs.data[0]?.id}`);
      console.log(`   Active: ${existingConfigs.data[0]?.active}`);
      return;
    }

    // Create new customer portal configuration
    const portalConfig = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your subscription",
        privacy_policy_url: "https://engagekit.iot/privacy", // Update with your actual URL
        terms_of_service_url: "https://engagekit.io/terms", // Update with your actual URL
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "shipping", "phone", "tax_id"],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          proration_behavior: "none",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "other",
            ],
          },
        },
        subscription_pause: {
          enabled: false, // You can enable this if you want pause functionality
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price", "quantity", "promotion_code"],
          proration_behavior: "create_prorations",
          products: [
            {
              product: "prod_SbbGTzwkeyTyPY", // Weekly product
              prices: ["price_1RgO4IIeOImcBhu6i3t8slGo"], // Weekl price
            },
            {
              product: "prod_RxVyOOcNMLC1Sk", // Monthly product
              prices: ["price_1RgO2AIeOImcBhu6rV6M9PmD"], // Monthly price
            },
            {
              product: "prod_RxWTt3Py1f7gvF", // Yearly product
              prices: ["price_1RgO29IeOImcBhu6KnZqFvZK"], // Yearly price
            },
          ],
        },
      },
      default_return_url: "https://engagekit.io/account", // Update with your actual URL
    });

    console.log("✅ Customer Portal configuration created successfully!");
    console.log(`   Configuration ID: ${portalConfig.id}`);
    console.log(`   Active: ${portalConfig.active}`);
    console.log(`   Default return URL: ${portalConfig.default_return_url}`);

    // Update the configuration to be active (if not already)
    if (!portalConfig.active) {
      await stripe.billingPortal.configurations.update(portalConfig.id, {
        active: true,
      });
      console.log("✅ Configuration activated!");
    }
  } catch (error) {
    console.error("❌ Error setting up Customer Portal:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Main function to run the setup
 */
async function main() {
  console.log("🚀 Starting Stripe Customer Portal setup...");

  try {
    await setupCustomerPortal();
    console.log("\n🎉 Customer Portal setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Test the customer portal in your Stripe dashboard");
    console.log(
      "   2. Update the privacy_policy_url and terms_of_service_url with your actual URLs",
    );
    console.log("   3. Update the default_return_url with your actual domain");
    console.log("   4. Customize the features as needed for your business");
  } catch (error) {
    console.error("❌ Setup failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { setupCustomerPortal };
