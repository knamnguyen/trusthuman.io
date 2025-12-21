import { QUANTITY_PRICING_CONFIG } from "./schema-validators";

/**
 * Get quantity pricing breakdown for display
 *
 * @param numSlots - Number of slots (1-24)
 * @param billingCycle - "MONTHLY" or "YEARLY"
 * @returns Pricing breakdown object
 */
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
