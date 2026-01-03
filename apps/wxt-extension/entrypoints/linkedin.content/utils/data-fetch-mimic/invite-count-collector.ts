import { DataCollector } from "./data-collector";
import { fetchInviteCount, type InviteCountData } from "./linkedin-invite-count-fetcher";

/**
 * Collector for invite count
 * - Stores last 90 snapshots
 * - Minimum 24 hours between auto-fetches
 * - Storage key: "local:invite-count"
 */
export const inviteCountCollector = new DataCollector<InviteCountData>(
  {
    storageKey: "invite-count",
    maxSnapshots: 90,
    minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  fetchInviteCount,
);
