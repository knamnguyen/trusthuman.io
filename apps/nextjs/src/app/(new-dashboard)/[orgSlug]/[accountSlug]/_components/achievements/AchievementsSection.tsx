"use client";

import { ActivityHeatMapCard } from "./cards/ActivityHeatMapCard";
import { BestFriendsCard } from "./cards/BestFriendsCard";
import { NetworkTreemapCard } from "./cards/NetworkTreemapCard";
import { ProfileMetricsCard } from "./cards/ProfileMetricsCard";

export function AchievementsSection() {
  return (
    <section className="w-full">
      <h2 className="mb-6 text-2xl font-bold">Achievements</h2>

      {/* Bento Grid Container */}
      <div className="grid gap-4 md:grid-cols-2 lg:[grid-template-areas:'profile_network'_'activity_network'_'friends_friends']">
        {/* Profile Metrics Card */}
        <div className="lg:[grid-area:profile]">
          <ProfileMetricsCard />
        </div>

        {/* Network Treemap - 50% width, spans 2 rows */}
        <div className="lg:[grid-area:network] lg:row-span-2">
          <NetworkTreemapCard />
        </div>

        {/* Activity Heat Map */}
        <div className="lg:[grid-area:activity]">
          <ActivityHeatMapCard />
        </div>

        {/* Best Friends */}
        <div className="lg:[grid-area:friends]">
          <BestFriendsCard />
        </div>
      </div>
    </section>
  );
}
