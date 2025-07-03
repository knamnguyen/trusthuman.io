// apps/nextjs/src/_components/subscribe-button.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react"; // Correct TRPC import

interface SubscribeButtonProps {
  purchaseType: "WEEKLY" | "MONTHLY" | "YEARLY";
  buttonText?: string; // Custom button text
  className?: string; // CSS class for styling
}

/**
 * Button that redirects user to Stripe checkout
 * Uses tRPC to create a checkout session
 */
export function SubscribeButton({
  purchaseType,
  buttonText = purchaseType === "WEEKLY"
    ? "Subscribe Weekly"
    : purchaseType === "MONTHLY"
      ? "Subscribe Monthly"
      : "Subscribe Yearly",
  className = "py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300",
}: SubscribeButtonProps) {
  const trpc = useTRPC();

  // react-query mutation for creating checkout
  const { mutateAsync: createCheckout, isPending } = useMutation(
    trpc.stripe.createCheckout.mutationOptions({}),
  );

  const handleClick = async () => {
    try {
      // Call tRPC to create checkout session
      const { url } = await createCheckout({
        purchaseType,
      });

      // Redirect to Stripe checkout page
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <button onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? "Redirecting to checkout..." : buttonText}
    </button>
  );
}
