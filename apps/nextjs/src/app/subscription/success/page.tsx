"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { useSubscription } from "~/hooks/use-subscription";

/**
 * Page shown after successful checkout
 */
export default function SubscriptionSuccessPage() {
  const { hasAccess, accessType, isLoading } = useSubscription();

  // Force a refetch of subscription status on page load
  useEffect(() => {
    // This would typically use a query client invalidation
    // For example: queryClient.invalidateQueries(['subscription'])
    window.location.reload();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <BadgeCheck className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="mt-4 text-2xl font-bold text-gray-800">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardDescription>
              Verifying your subscription status...
            </CardDescription>
          ) : hasAccess ? (
            <CardDescription>
              {`Your ${accessType} access is now active!`}
            </CardDescription>
          ) : (
            <CardDescription>
              Payment received. Your access should be activated soon. It may
              take a few moments to update.
            </CardDescription>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/subscription">Return to Subscription Page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
