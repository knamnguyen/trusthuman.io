"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

import { useTRPC } from "~/trpc/react";
import { ActivityCard, type ActivityCardProps } from "./activity-card";
import { MESSAGING } from "./landing-content";

export function ActivityFeedSection() {
  const trpc = useTRPC();

  const { data: activities, isLoading } = useQuery({
    ...trpc.trustProfile.getRecentActivity.queryOptions({ limit: 9 }),
    refetchInterval: 60000, // Refresh every minute
  });

  // Don't render section if no activities
  if (!isLoading && (!activities || activities.length === 0)) {
    return null;
  }

  return (
    <section className="bg-card py-20 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {MESSAGING.activityFeed.headline}
          </h2>
          <p className="text-muted-foreground text-xl">
            {MESSAGING.activityFeed.subheadline}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>💬 Recent Verified Human Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="mb-4 break-inside-avoid-column"
                  >
                    <div className="bg-muted/50 h-48 animate-pulse rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
                {activities?.map((activity) => (
                  <div
                    key={activity.id}
                    className="mb-4 break-inside-avoid-column"
                  >
                    <ActivityCard {...(activity as ActivityCardProps)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
