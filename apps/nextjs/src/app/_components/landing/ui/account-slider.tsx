"use client";

import { Slider } from "@sassy/ui/slider";

interface AccountSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  pricePerAccount: number;
  isYearly: boolean;
}

export function AccountSlider({
  value,
  onChange,
  min,
  max,
  pricePerAccount,
  isYearly,
}: AccountSliderProps) {
  // Always show monthly equivalent price
  const monthlyPricePerAccount = isYearly ? pricePerAccount / 12 : pricePerAccount;
  const monthlyTotal = monthlyPricePerAccount * value;
  const yearlyTotal = pricePerAccount * value;

  return (
    <div className="mt-6 space-y-3 p-4 rounded-lg border-2 border-primary/30 bg-primary/10">
      <label className="text-sm font-semibold text-foreground">
        Number of accounts: <span className="text-primary">{value}</span>
      </label>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val ?? min)}
        min={min}
        max={max}
        step={1}
        className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-2 [&_[role=slider]]:border-border"
      />
      <p className="text-xs text-muted-foreground">
        {value} accounts × ${monthlyPricePerAccount.toFixed(2)}/mo ={" "}
        <span className="font-bold text-primary">${monthlyTotal.toFixed(2)}</span>
      </p>
      {isYearly && (
        <p className="text-xs text-muted-foreground">
          ${yearlyTotal.toFixed(2)} billed yearly
        </p>
      )}
    </div>
  );
}
