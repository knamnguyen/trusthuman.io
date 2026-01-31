"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
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
  const [updateQuantity, setUpdateQuantity] = useState<number | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const orgId = organization?.id;

  const trpc = useTRPC();

  const queryClient = useQueryClient();

  const router = useRouter();

  const { data: prices } = useQuery({
    ...trpc.organization.subscription.pricing.queryOptions(),
  });

  const { data: status } = useQuery(
    trpc.organization.subscription.status.queryOptions(undefined, {
      enabled: !!orgId,
    }),
  );

  // Initialize updateQuantity when status loads
  useEffect(() => {
    if (status?.purchasedSlots && updateQuantity === null) {
      setUpdateQuantity(status.purchasedSlots);
    }
  }, [status?.purchasedSlots, updateQuantity]);

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

  const updateSubscription = useMutation({
    ...trpc.organization.subscription.update.mutationOptions(),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error);
        return;
      }

      if (data.isDowngrade === true) {
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.subscription.status.queryKey(),
        });
        setShowUpdateConfirm(false);
        setUpdateQuantity(status?.purchasedSlots ?? data.newSlots);
        toast.success(
          `Downgrade scheduled. Your slots will reduce to ${data.newSlots} on ${data.effectiveAt.toString()}.`,
        );
        return;
      }

      router.push(data.url);
    },
  });

  const isFreeTier = status?.subscriptionTier === "FREE";
  const isAdmin = status?.role === "admin";
  const isPayer = status?.isPayer ?? false;
  const isOverQuota = (status?.usedSlots ?? 0) > (status?.purchasedSlots ?? 1);

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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
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

            {isFreeTier && (
              <Badge variant="secondary" className="mt-4">
                Current Plan
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Premium Tier Card */}
        <Card className="border-primary flex flex-col border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Premium</CardTitle>
              {!isFreeTier && <Badge>Current Plan</Badge>}
            </div>
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
              ) : !isFreeTier && (isPayer || isAdmin) ? (
                <div className="space-y-4">
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>{status.purchasedSlots} slots</strong> •{" "}
                      {status.usedSlots} used
                    </p>
                    <p className="text-muted-foreground">
                      {status.expiresAt
                        ? `Renews on ${new Date(status.expiresAt).toLocaleDateString()}`
                        : "No expiry date"}
                    </p>
                    {status.payer && !isPayer && (
                      <p className="text-sm">
                        Paid by {status.payer.firstName} {status.payer.lastName}
                      </p>
                    )}
                  </div>

                  {/* Slot Update UI - Only for payer */}
                  {isPayer && updateQuantity !== null && (
                    <div className="border-t pt-4">
                      <Label
                        htmlFor="update-quantity"
                        className="mb-2 block text-sm font-medium"
                      >
                        Update Slot Count
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="update-quantity"
                          type="text"
                          value={updateQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1) {
                              setUpdateQuantity(val);
                            } else if (e.target.value === "") {
                              setUpdateQuantity(0); // Allow empty input
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => setShowUpdateConfirm(true)}
                          disabled={
                            updateSubscription.isPending ||
                            updateQuantity === status.purchasedSlots ||
                            updateQuantity < 1
                          }
                          variant="primary"
                        >
                          {updateQuantity > status.purchasedSlots
                            ? "Upgrade"
                            : updateQuantity < status.purchasedSlots
                              ? "Downgrade"
                              : "Update"}
                        </Button>
                        <Button
                          onClick={() =>
                            setUpdateQuantity(status.purchasedSlots)
                          }
                          variant="ghost"
                        >
                          Reset
                        </Button>
                      </div>
                      {updateQuantity !== status.purchasedSlots && (
                        <p className="text-muted-foreground mt-2 text-xs">
                          {updateQuantity > status.purchasedSlots
                            ? "You'll be charged a prorated amount for the additional slots."
                            : `Reducing slots will apply a credit to your next invoice.${
                                updateQuantity < status.usedSlots
                                  ? ` Warning: ${status.usedSlots - updateQuantity} account(s) will be disabled.`
                                  : ""
                              }`}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleManageSubscription}
                    disabled={createPortal.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {createPortal.isPending
                      ? "Loading..."
                      : "Manage Billing & Invoices"}
                  </Button>
                </div>
              ) : (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardHeader>
                    <CardDescription className="text-blue-900 dark:text-blue-100">
                      Contact {status.payer?.firstName ?? "an admin"} to manage
                      billing.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Subscription Confirmation Dialog */}
      <Dialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateQuantity !== null && updateQuantity > status.purchasedSlots
                ? "Confirm Upgrade"
                : "Confirm Downgrade"}
            </DialogTitle>
            <DialogDescription>
              {updateQuantity !== null &&
              updateQuantity > status.purchasedSlots ? (
                <>
                  You are upgrading from{" "}
                  <strong>{status.purchasedSlots} slots</strong> to{" "}
                  <strong>{updateQuantity} slots</strong>.
                  <br />
                  <br />A prorated amount for the additional{" "}
                  {updateQuantity - status.purchasedSlots} slot(s) will be
                  charged.
                </>
              ) : (
                <>
                  You are downgrading from{" "}
                  <strong>{status.purchasedSlots} slots</strong> to{" "}
                  <strong>{updateQuantity} slots</strong>.
                  <br />
                  <br />
                  Credit for the unused slots will be applied to your next
                  invoice.
                  {updateQuantity !== null &&
                    updateQuantity < status.usedSlots && (
                      <>
                        <br />
                        <br />
                        <span className="font-semibold text-red-600">
                          Warning: You currently have {status.usedSlots}{" "}
                          account(s) connected.{" "}
                          {status.usedSlots - updateQuantity} account(s) will be
                          disabled to fit within your new slot limit.
                        </span>
                      </>
                    )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateConfirm(false)}
              disabled={updateSubscription.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                updateQuantity !== null && updateQuantity < status.usedSlots
                  ? "destructive"
                  : "primary"
              }
              onClick={() =>
                updateQuantity !== null &&
                updateSubscription.mutate({ slots: updateQuantity })
              }
              disabled={updateSubscription.isPending}
            >
              {updateSubscription.isPending
                ? "Processing..."
                : updateQuantity !== null &&
                    updateQuantity > status.purchasedSlots
                  ? "Confirm Upgrade"
                  : "Confirm Downgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
