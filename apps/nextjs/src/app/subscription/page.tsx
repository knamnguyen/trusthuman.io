"use client";

import { useUser } from "@clerk/nextjs";
import { BadgeCheck, Check } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { GumroadCarousel } from "~/app/_components/landing/gumroad-carousel";
import { useSubscription } from "~/hooks/use-subscription";
import { FeaturesSection } from "../_components/landing/features-section";
import { SubscribeButton } from "../../_components/subscribe-button";

const freeFeatures = [
  "15 free comments per day",
  "5 preset styles",
  "Duplicate post comment check",
  "Auto scroll & comment",
];

const premiumFeatures = [
  "100 comments per day",
  "Skip authors if already commented",
  "Time filter for posts",
  "Unlimited comment style configuration",
  "Anti-bot detection & humanizer",
  "Private support group",
];

/**
 * Subscription page showing how to use the Stripe integration
 */
export default function SubscriptionPage() {
  const { isSignedIn } = useUser();
  let { hasAccess, accessType, isLoading } = useSubscription();

  if (accessType === "FREE") hasAccess = false;

  // Whether to show the manage subscription button (only for subscription users)
  const showManageSubscription =
    hasAccess && ["WEEKLY", "MONTHLY", "YEARLY"].includes(accessType);
  console.log("hasAccess", hasAccess);
  console.log("accessType", accessType);
  console.log("isLoading", isLoading);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <p className="text-lg text-gray-500">Loading...</p>
          </div>
        ) : hasAccess ? (
          <Card className="mx-auto w-full max-w-lg border-2 border-black text-center shadow-[8px_8px_0px_#000]">
            <CardHeader>
              <BadgeCheck className="mx-auto h-16 w-16 text-pink-500" />
              <CardTitle className="mt-4 text-3xl font-bold">
                {`Your ${accessType} access is active!`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                You have full access to all premium features.
              </p>
            </CardContent>
            {showManageSubscription && (
              <CardFooter className="flex justify-center">
                <button className="rounded-md border-2 border-black bg-black px-6 py-2 font-semibold text-white shadow-[4px_4px_0px_#000] hover:bg-gray-800 hover:shadow-none">
                  Manage Subscription
                </button>
              </CardFooter>
            )}
          </Card>
        ) : (
          <div className="space-y-10">
            <FeaturesSection />

            <div className="flex flex-col items-stretch gap-8 lg:flex-row">
              <Card className="w-full rounded-lg border-2 border-black p-6 shadow-[8px_8px_0px_#000] lg:w-1/4">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl font-bold">Free</CardTitle>
                </CardHeader>
                <CardContent className="mt-4 p-0">
                  <ul className="space-y-2">
                    {freeFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-pink-500" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="w-full rounded-lg border-2 border-black p-6 shadow-[8px_8px_0px_#000] lg:w-3/4">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl font-bold">Premium</CardTitle>
                </CardHeader>
                <CardContent className="mt-4 p-0">
                  <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
                    {premiumFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-pink-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="relative flex flex-col rounded-lg border-2 border-black shadow-[8px_8px_0px_#000]">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 border-2 border-black bg-gray-200 px-4 py-1.5 text-sm font-bold text-black">
                  No Risk
                </Badge>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Weekly</CardTitle>
                  <p className="text-4xl font-bold">
                    $7.99 <span className="text-lg font-medium">/ week</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600">
                    A weekly intern. Day and night.
                  </p>
                </CardContent>
                <CardFooter>
                  <SubscribeButton
                    purchaseType="WEEKLY"
                    buttonText="Start Weekly"
                    className="w-full cursor-pointer rounded-md border-2 border-black bg-gray-200 py-2 font-bold text-black shadow-[4px_4px_0px_#000] hover:bg-gray-300 hover:shadow-none"
                  />
                </CardFooter>
              </Card>

              <Card className="relative flex flex-col rounded-lg border-2 border-pink-500 shadow-[8px_8px_0px_#f472b6]">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 border-2 border-black bg-pink-500 px-4 py-1.5 text-sm font-bold text-white">
                  Most Popular
                </Badge>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Monthly</CardTitle>
                  <div className="flex items-baseline gap-x-2">
                    <p className="text-4xl font-bold">
                      $24.99{" "}
                      <span className="text-lg font-medium">/ month</span>
                    </p>
                    <Badge
                      variant="destructive"
                      className="border-2 border-black"
                    >
                      Save 22%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600">
                    Your monthly intern. No weekends.
                  </p>
                </CardContent>
                <CardFooter>
                  <SubscribeButton
                    purchaseType="MONTHLY"
                    buttonText="Go Monthly"
                    className="w-full cursor-pointer rounded-md border-2 border-black bg-pink-500 py-2 font-bold text-white shadow-[4px_4px_0px_#000] hover:bg-pink-600 hover:shadow-none"
                  />
                </CardFooter>
              </Card>

              <Card className="relative flex flex-col rounded-lg border-2 border-black shadow-[8px_8px_0px_#000]">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 border-2 border-black bg-yellow-400 px-4 py-1.5 text-sm font-bold text-black">
                  Most Savings
                </Badge>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Yearly</CardTitle>
                  <div className="flex items-baseline gap-x-2">
                    <p className="text-4xl font-bold">
                      $199.99{" "}
                      <span className="text-lg font-medium">/ year</span>
                    </p>
                    <Badge
                      variant="destructive"
                      className="border-2 border-black"
                    >
                      Save over 33%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600">
                    Your yearly intern. All year around
                  </p>
                </CardContent>
                <CardFooter>
                  <SubscribeButton
                    purchaseType="YEARLY"
                    buttonText="Go Yearly"
                    className="w-full cursor-pointer rounded-md border-2 border-black bg-gray-200 py-2 font-bold text-black shadow-[4px_4px_0px_#000] hover:bg-gray-300 hover:shadow-none"
                  />
                </CardFooter>
              </Card>
            </div>

            <GumroadCarousel />
          </div>
        )}
      </div>
    </div>
  );
}
