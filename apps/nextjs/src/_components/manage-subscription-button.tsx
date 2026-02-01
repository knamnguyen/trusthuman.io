"use client";

import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

interface ManageSubscriptionButtonProps {
  buttonText?: string;
  className?: string;
}

/**
 * Button that redirects user to Stripe customer portal
 * Uses org-centric billing (organization.subscription.portal)
 */
export function ManageSubscriptionButton({
  buttonText = "Manage subscription",
  className = "py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300",
}: ManageSubscriptionButtonProps) {
  const trpc = useTRPC();

  const { mutateAsync: createPortal, isPending } = useMutation(
    trpc.organization.subscription.portal.mutationOptions(),
  );

  const handleClick = async () => {
    try {
      const { url } = await createPortal();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error("Customer portal error:", error);
    }
  };

  return (
    <button onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? "Redirecting to portal..." : buttonText}
    </button>
  );
}
