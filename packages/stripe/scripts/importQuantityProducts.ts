#!/usr/bin/env tsx
/**
 * Import Quantity Products to Stripe
 *
 * This script creates products with flat per-unit pricing for multi-account billing.
 *
 * Pricing:
 * - Monthly: $24.99/slot/mo (1-24 slots)
 * - Yearly:  $249/slot/yr (1-24 slots, save 17%)
 * - Enterprise (25+): Contact sales
 *
 * Usage:
 *   pnpm stripe:quantity              # Runs against test keys
 *   pnpm stripe:quantity --production # Required for live keys
 *   pnpm stripe:quantity --dry-run    # Preview without creating
 */
import fs from "fs";
import path from "path";
import Stripe from "stripe";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG_FILE = path.resolve(
  process.cwd(),
  "assets/quantity-products-config.json",
);

// ============================================================================
// TYPES
// ============================================================================

interface PriceConfig {
  product_id: string;
  currency: string;
  billing_scheme: "per_unit";
  unit_amount: number;
  recurring: {
    interval: "month" | "year";
    interval_count: number;
    usage_type: "licensed" | "metered";
  };
  metadata: Record<string, string>;
}

interface ProductConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  metadata: Record<string, string>;
}

interface ConfigFile {
  products: ProductConfig[];
  prices: PriceConfig[];
  pricing_display: Record<string, unknown>;
}

interface CreatedIds {
  products: Map<string, string>; // config_id -> stripe_id
  prices: Map<string, string>; // config_product_id -> stripe_price_id
}

// ============================================================================
// SAFETY CHECKS
// ============================================================================

function checkEnvironment(): {
  isProduction: boolean;
  secretKey: string;
} {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error(
      "❌ Error: STRIPE_SECRET_KEY environment variable is required",
    );
    process.exit(1);
  }

  const isProduction = secretKey.startsWith("sk_live_");

  return { isProduction, secretKey };
}

function validateProductionRun(isProduction: boolean): void {
  const args = process.argv.slice(2);
  const hasProductionFlag = args.includes("--production");
  const isDryRun = args.includes("--dry-run");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made to Stripe\n");
    return;
  }

  if (isProduction && !hasProductionFlag) {
    console.error("");
    console.error("⚠️  PRODUCTION KEYS DETECTED!");
    console.error("");
    console.error("You are about to create products in LIVE Stripe.");
    console.error("This will affect real billing and customers.");
    console.error("");
    console.error("To proceed, run with --production flag:");
    console.error("  pnpm stripe:quantity --production");
    console.error("");
    console.error("To preview without changes, run with --dry-run:");
    console.error("  pnpm stripe:quantity --dry-run");
    console.error("");
    process.exit(1);
  }

  if (isProduction) {
    console.log("");
    console.log("🚨 PRODUCTION MODE 🚨");
    console.log("Creating products in LIVE Stripe environment.");
    console.log("");
  }
}

// ============================================================================
// STRIPE OPERATIONS
// ============================================================================

async function createProduct(
  stripe: Stripe,
  config: ProductConfig,
  isDryRun: boolean,
): Promise<string | null> {
  // Check if product already exists
  try {
    const existing = await stripe.products.retrieve(config.id);
    console.log(`✅ Product already exists: ${existing.name} (${config.id})`);
    return existing.id;
  } catch (error) {
    // Product doesn't exist, create it
  }

  if (isDryRun) {
    console.log(
      `🔍 [DRY RUN] Would create product: ${config.name} (${config.id})`,
    );
    return config.id;
  }

  try {
    const product = await stripe.products.create({
      id: config.id,
      name: config.name,
      description: config.description,
      metadata: {
        ...config.metadata,
        imported: "true",
        importDate: new Date().toISOString(),
        importScript: "importQuantityProducts.ts",
      },
    });

    console.log(`✅ Created product: ${product.name} (${product.id})`);
    return product.id;
  } catch (error) {
    console.error(
      `❌ Error creating product ${config.id}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function createQuantityPrice(
  stripe: Stripe,
  config: PriceConfig,
  productStripeId: string,
  isDryRun: boolean,
): Promise<string | null> {
  // In dry-run mode, skip API calls and just show what would happen
  if (isDryRun) {
    console.log(
      `🔍 [DRY RUN] Would create quantity price for ${config.recurring.interval}ly:`,
    );
    console.log(`   Product: ${productStripeId}`);
    const amount = (config.unit_amount / 100).toFixed(2);
    console.log(`   Price: $${amount}/slot per ${config.recurring.interval}`);
    return `price_dry_run_${config.recurring.interval}`;
  }

  // Check if a similar price already exists for this product
  const existingPrices = await stripe.prices.list({
    product: productStripeId,
    active: true,
    limit: 10,
  });

  const existingQuantityPrice = existingPrices.data.find(
    (p) =>
      p.billing_scheme === "per_unit" &&
      p.recurring?.interval === config.recurring.interval,
  );

  if (existingQuantityPrice) {
    console.log(
      `✅ Quantity price already exists for ${config.recurring.interval}ly: ${existingQuantityPrice.id}`,
    );
    return existingQuantityPrice.id;
  }

  try {
    const price = await stripe.prices.create({
      product: productStripeId,
      currency: config.currency,
      billing_scheme: "per_unit",
      unit_amount: config.unit_amount,
      recurring: {
        interval: config.recurring.interval,
        interval_count: config.recurring.interval_count,
        usage_type: config.recurring.usage_type,
      },
      metadata: {
        ...config.metadata,
        imported: "true",
        importDate: new Date().toISOString(),
        importScript: "importQuantityProducts.ts",
      },
    });

    const amount = (config.unit_amount / 100).toFixed(2);
    console.log(
      `✅ Created quantity price for ${config.recurring.interval}ly: ${price.id}`,
    );
    console.log(`   Price: $${amount}/slot per ${config.recurring.interval}`);

    return price.id;
  } catch (error) {
    console.error(
      `❌ Error creating quantity price:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🚀 Quantity Products Import Script");
  console.log("===================================\n");

  // Check environment and safety
  const { isProduction, secretKey } = checkEnvironment();
  const isDryRun = process.argv.includes("--dry-run");

  console.log(`Environment: ${isProduction ? "🔴 PRODUCTION" : "🟢 TEST"}`);
  console.log(`Mode: ${isDryRun ? "🔍 DRY RUN" : "📝 LIVE"}\n`);

  validateProductionRun(isProduction);

  // Initialize Stripe
  const stripe = new Stripe(secretKey, {
    apiVersion: "2023-08-16",
  });

  // Load configuration
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`❌ Config file not found: ${CONFIG_FILE}`);
    process.exit(1);
  }

  const config: ConfigFile = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  console.log(
    `📋 Loaded config: ${config.products.length} products, ${config.prices.length} prices\n`,
  );

  // Track created IDs
  const createdIds: CreatedIds = {
    products: new Map(),
    prices: new Map(),
  };

  // Create products
  console.log("📦 Creating Products...\n");
  for (const productConfig of config.products) {
    const stripeId = await createProduct(stripe, productConfig, isDryRun);
    if (stripeId) {
      createdIds.products.set(productConfig.id, stripeId);
    }
  }

  // Create prices
  console.log("\n💰 Creating Quantity Prices...\n");
  for (const priceConfig of config.prices) {
    const productStripeId = createdIds.products.get(priceConfig.product_id);
    if (!productStripeId) {
      console.warn(
        `⚠️ Skipping price - product not found: ${priceConfig.product_id}`,
      );
      continue;
    }

    const priceId = await createQuantityPrice(
      stripe,
      priceConfig,
      productStripeId,
      isDryRun,
    );
    if (priceId) {
      createdIds.prices.set(priceConfig.product_id, priceId);
    }
  }

  // Summary
  console.log("\n===================================");
  console.log("📊 SUMMARY");
  console.log("===================================\n");

  if (isDryRun) {
    console.log("🔍 DRY RUN COMPLETE - No changes were made\n");
  } else {
    console.log("✅ Import complete!\n");
  }

  console.log("Products:");
  createdIds.products.forEach((stripeId, configId) => {
    console.log(`  ${configId} → ${stripeId}`);
  });

  console.log("\nPrices:");
  createdIds.prices.forEach((priceId, productId) => {
    console.log(`  ${productId} → ${priceId}`);
  });

  console.log("\n📝 Next steps:");
  console.log("  1. Copy the price IDs above to schema-validators.ts");
  console.log("  2. Update setupCustomerPortal.ts with new product/price IDs");
  console.log("  3. Test checkout flow with new quantity pricing");
  console.log("");
}

// Run
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
