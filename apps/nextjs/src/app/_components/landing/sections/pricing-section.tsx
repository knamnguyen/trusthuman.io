"use client";

import { useState } from "react";

import { MESSAGING } from "../landing-content";
import { PricingCard } from "../cards/pricing-card";
import { PlanToggle } from "../ui/plan-toggle";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true); // Default to yearly
  const [accountCount, setAccountCount] = useState(2); // Default for Premium Multi

  return (
    <section id="pricing" className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.pricing.headline}
          </h2>
          <p className="text-xl text-muted-foreground">
            {MESSAGING.pricing.subheadline}
          </p>
        </div>

        {/* Monthly/Yearly Toggle */}
        <PlanToggle isYearly={isYearly} onToggle={setIsYearly} />

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MESSAGING.pricing.tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isYearly={isYearly}
              accountCount={tier.id === "premium-multi" ? accountCount : undefined}
              onAccountCountChange={
                tier.id === "premium-multi" ? setAccountCount : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
