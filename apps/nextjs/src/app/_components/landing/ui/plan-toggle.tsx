"use client";

import { Badge } from "@sassy/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@sassy/ui/tabs";

import { MESSAGING } from "../landing-content";

interface PlanToggleProps {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}

export function PlanToggle({ isYearly, onToggle }: PlanToggleProps) {
  return (
    <div className="flex justify-center mb-12">
      <Tabs
        value={isYearly ? "yearly" : "monthly"}
        onValueChange={(value) => onToggle(value === "yearly")}
      >
        <TabsList className="border-2 border-border bg-card">
          <TabsTrigger value="monthly" className="font-semibold data-[state=active]:shadow-none">
            {MESSAGING.pricing.billingToggle.monthly}
          </TabsTrigger>
          <TabsTrigger value="yearly" className="font-semibold data-[state=active]:shadow-none">
            Yearly
            <Badge className="ml-2 text-xs bg-secondary text-secondary-foreground">
              Save 17%
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
