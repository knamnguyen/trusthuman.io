"use client";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

import { getFormattedPrice } from "../landing-content";
import { AccountSlider } from "../ui/account-slider";

interface PricingTier {
  id: string;
  name: string;
  badge: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPricePerAccount?: number;
  yearlyPricePerAccount?: number;
  description: string;
  accountRange?: { min: number; max: number };
  features: string[];
  cta: string;
  ctaLink: string;
  featured?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  isYearly: boolean;
  accountCount?: number;
  onAccountCountChange?: (count: number) => void;
}

export function PricingCard({
  tier,
  isYearly,
  accountCount,
  onAccountCountChange,
}: PricingCardProps) {
  // Calculate price based on tier type
  let displayPrice = 0;
  if (tier.id === "premium-multi" && accountCount) {
    const pricePerAccount = isYearly
      ? tier.yearlyPricePerAccount ?? 0
      : tier.monthlyPricePerAccount ?? 0;
    displayPrice = pricePerAccount * accountCount;
  } else {
    displayPrice = isYearly ? tier.yearlyPrice ?? 0 : tier.monthlyPrice ?? 0;
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col border-2 border-border shadow-[4px_4px_0px_#000] bg-card transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]",
        tier.featured &&
          "border-primary scale-105 shadow-[6px_6px_0px_hsl(var(--primary))] hover:shadow-[4px_4px_0px_hsl(var(--primary))]",
      )}
    >
      {tier.featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_#000]">
          {tier.badge}
        </Badge>
      )}

      <CardHeader className="text-center">
        {!tier.featured && (
          <Badge variant="secondary" className="mb-2 self-center">
            {tier.badge}
          </Badge>
        )}
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <div className="text-4xl font-bold text-primary py-4">
          {getFormattedPrice(displayPrice)}
          {displayPrice > 0 && (
            <span className="text-lg text-muted-foreground font-normal">
              /{isYearly ? "year" : "month"}
            </span>
          )}
        </div>
        <CardDescription className="text-base">
          {tier.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="size-5 text-secondary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Account Slider for Premium Multi */}
        {tier.id === "premium-multi" &&
          accountCount &&
          onAccountCountChange &&
          tier.accountRange && (
            <AccountSlider
              value={accountCount}
              onChange={onAccountCountChange}
              min={tier.accountRange.min}
              max={tier.accountRange.max}
              pricePerAccount={
                isYearly
                  ? tier.yearlyPricePerAccount ?? 0
                  : tier.monthlyPricePerAccount ?? 0
              }
              isYearly={isYearly}
            />
          )}
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          asChild
          className={cn(
            "w-full border-2 border-border shadow-[2px_2px_0px_#000] font-bold",
            tier.featured
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-background text-foreground hover:bg-muted",
          )}
        >
          <a href={tier.ctaLink} target={tier.id === "free" ? "_blank" : undefined} rel={tier.id === "free" ? "noopener noreferrer" : undefined}>
            {tier.cta}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
