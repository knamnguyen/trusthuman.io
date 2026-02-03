"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";
import { Skeleton } from "@sassy/ui/skeleton";
import { toast } from "@sassy/ui/toast";

import { useTRPC } from "~/trpc/react";

export default function SettingsPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  ); // Default: yearly (recommended)
  const [quantity, setQuantity] = useState(1);

  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const orgId = organization?.id;

  const trpc = useTRPC();

  const router = useRouter();

  const { data: prices } = useQuery({
    ...trpc.organization.subscription.pricing.queryOptions(),
  });

  const { data: status } = useQuery(
    trpc.organization.subscription.status.queryOptions(undefined, {
      enabled: !!orgId,
    }),
  );

  const createCheckout = useMutation({
    ...trpc.organization.subscription.checkout.mutationOptions(),
    onSuccess: (data) => {
      if (data.url === null) {
        toast.error(
          "Failed to create checkout session. Please contact engagekit.io@gmail.com for support",
        );
        return;
      }

      router.push(data.url);
    },
  });

  const createPortal = useMutation({
    ...trpc.organization.subscription.portal.mutationOptions(),
    onSuccess: (data) => {
      router.push(data.url);
    },
  });

  const isFreeTier = status?.subscriptionTier === "FREE";
  const isAdmin = status?.role === "admin";
  const isPayer = status?.isPayer ?? false;
  const isOverQuota = (status?.usedSlots ?? 0) > (status?.purchasedSlots ?? 1);
  const premiumSource = (status as { premiumSource?: "paid" | "earned" | "none" } | undefined)?.premiumSource ?? "none";
  const earnedPremiumExpiresAt = (status as { earnedPremiumExpiresAt?: string | null } | undefined)?.earnedPremiumExpiresAt;
  const earnedDaysRemaining = earnedPremiumExpiresAt
    ? Math.max(0, Math.ceil((new Date(earnedPremiumExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Price calculation
  const pricePerSlot =
    billingCycle === "monthly"
      ? (prices?.monthly.amount ?? 2999) / 100
      : (prices?.yearly.amount ?? 29999) / 100 / 12; // Monthly equivalent

  const totalMonthly = pricePerSlot * quantity;
  const savings =
    billingCycle === "yearly" ? (29.99 - pricePerSlot) * quantity * 12 : 0;

  const handleUpgrade = () => {
    createCheckout.mutate({
      slots: quantity,
      interval: billingCycle,
      endorsely_referral: window.endorsely_referral,
    });
  };

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  if (!isOrgLoaded || prices === undefined || status === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your organization's subscription and billing settings
          </p>
        </div>

      {/* Over Quota Warning */}
      {isOverQuota && !isFreeTier && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              Over Quota
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              You have {status.usedSlots} accounts but only{" "}
              {status.purchasedSlots} slots. Premium features are disabled.{" "}
              <Link
                href={`/${orgSlug}/accounts`}
                className="underline hover:text-yellow-950 dark:hover:text-yellow-50"
              >
                Remove {status.usedSlots - status.purchasedSlots} account(s)
              </Link>{" "}
              or{" "}
              <button
                onClick={handleManageSubscription}
                className="underline hover:text-yellow-950 dark:hover:text-yellow-50"
              >
                upgrade your plan
              </button>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Non-Admin View */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardDescription>
              Only admins can manage billing. Contact an admin to upgrade or
              manage the subscription.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Earned Premium Banner */}
      {premiumSource === "earned" && earnedDaysRemaining > 0 && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-900 dark:text-green-100">
              Earned Premium Active
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              You have {earnedDaysRemaining} day{earnedDaysRemaining !== 1 ? "s" : ""} of
              premium remaining from social referrals.{" "}
              <Link
                href={`/${orgSlug}/earn-premium`}
                className="underline hover:text-green-950 dark:hover:text-green-50"
              >
                Earn more days
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Current Plan Summary Card */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Plan Info */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isFreeTier
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-primary/10"
              }`}
            >
              <span className="text-lg">{isFreeTier ? "F" : "P"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {isFreeTier ? "Free Plan" : "Premium Plan"}
                </h3>
                {premiumSource === "earned" && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    Earned
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {status.purchasedSlots} slot{status.purchasedSlots !== 1 ? "s" : ""} • {status.usedSlots} used
              </p>
            </div>
          </div>

          {/* AI Quota Display */}
          <div className="flex flex-col items-center gap-1 border-x px-6">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              AI Generations Today
            </p>
            {status.aiQuota.limit === -1 || status.aiQuota.limit > 1_000_000 ? (
              <p className="text-lg font-semibold text-green-600">Unlimited</p>
            ) : (
              <>
                <p className="text-lg font-semibold">
                  <span className={status.aiQuota.left === 0 ? "text-red-500" : ""}>
                    {status.aiQuota.used}
                  </span>
                  <span className="text-muted-foreground">/{status.aiQuota.limit}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  Resets {new Date(status.aiQuota.resetsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                </p>
              </>
            )}
          </div>

          {/* Billing Info & Actions */}
          <div className="flex flex-col items-end gap-1 sm:gap-2">
            {!isFreeTier && status.expiresAt && (
              <p className="text-muted-foreground text-sm">
                Renews {new Date(status.expiresAt).toLocaleDateString()}
              </p>
            )}
            {!isFreeTier && (isPayer || isAdmin) ? (
              <Button
                onClick={handleManageSubscription}
                disabled={createPortal.isPending}
                variant="outline"
                size="sm"
              >
                {createPortal.isPending ? "Loading..." : "Manage Billing & Invoices"}
              </Button>
            ) : isFreeTier && isAdmin ? (
              <Button
                onClick={handleUpgrade}
                disabled={createCheckout.isPending}
                size="sm"
              >
                {createCheckout.isPending ? "Loading..." : "Upgrade to Premium"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Tier Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-muted-foreground text-sm">Forever free</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>1 LinkedIn account slot</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>Manual LinkedIn management</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>Target list collection</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>Comment history tracking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-red-500">✗</span>
                <span className="text-muted-foreground">No AI features</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-red-500">✗</span>
                <span className="text-muted-foreground">
                  No auto-engagement
                </span>
              </li>
            </ul>

          </CardContent>
        </Card>

        {/* Premium Tier Card */}
        <Card className="border-primary flex flex-col border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <div>
              <p className="text-3xl font-bold">
                ${pricePerSlot.toFixed(2)}
                <span className="text-sm font-normal">/slot/month</span>
              </p>
              {billingCycle === "yearly" && (
                <p className="text-muted-foreground text-sm">
                  Billed yearly at ${(pricePerSlot * 12).toFixed(2)}/slot/year
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>1-unlimited LinkedIn account slots</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span>All free features</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="font-semibold">AI-powered comments</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="font-semibold">Hyperbrowser virtual runs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="font-semibold">Auto-engagement campaigns</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="font-semibold">Priority support</span>
              </li>
            </ul>

            {/* Billing Cycle Toggle */}
            {isFreeTier && isAdmin && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={billingCycle === "monthly"}
                      onChange={() => setBillingCycle("monthly")}
                      className="h-4 w-4"
                    />
                    <span>Monthly</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={billingCycle === "yearly"}
                      onChange={() => setBillingCycle("yearly")}
                      className="h-4 w-4"
                    />
                    <span>Yearly</span>
                    <Badge variant="secondary" className="ml-1">
                      Save 16.7%
                    </Badge>
                  </label>
                </div>

                {/* Quantity Selector */}
                <div>
                  <Label
                    htmlFor="quantity"
                    className="mb-2 block text-sm font-medium"
                  >
                    Number of Slots (1-unlimited)
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="bg-muted space-y-1 rounded-lg py-4">
                  <div className="flex justify-between text-sm">
                    <span>
                      {quantity} slot(s) × ${pricePerSlot.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      $
                      {(
                        totalMonthly * (billingCycle === "monthly" ? 1 : 12)
                      ).toFixed(2)}
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-xs text-green-600">
                      You save ${savings.toFixed(2)}/year compared to monthly
                      billing
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4">
              {isFreeTier && isAdmin ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckout.isPending}
                  className="w-full"
                  size="lg"
                >
                  {createCheckout.isPending
                    ? "Loading..."
                    : "Upgrade to Premium"}
                </Button>
              ) : !isFreeTier ? (
                <div className="text-muted-foreground space-y-2 text-center text-sm">
                  {status.payer && !isPayer && (
                    <p>
                      Paid by {status.payer.firstName} {status.payer.lastName}
                    </p>
                  )}
                  <p>
                    To change plans or slots, use the{" "}
                    <button
                      onClick={handleManageSubscription}
                      className="text-primary underline hover:no-underline"
                      disabled={createPortal.isPending}
                    >
                      Manage Billing
                    </button>{" "}
                    button above.
                  </p>
                </div>
              ) : !isAdmin ? (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardHeader>
                    <CardDescription className="text-blue-900 dark:text-blue-100">
                      Contact an admin to upgrade.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
