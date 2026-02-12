import { ExternalLink, List, Users } from "lucide-react";

import { ReplyEditor } from "../_components/ReplyEditor";
import { XLink } from "../_components/XLink";
import type { ReplyState } from "./stores/engage-replies-store";
import type { EngageTweetData } from "./utils/parse-tweets";

interface TweetCardProps {
  tweet: EngageTweetData;
  reply: ReplyState | undefined;
  onTextChange: (text: string) => void;
  onRegenerate: () => void;
  onSend: () => void;
}

function relativeTime(timestamp: string): string {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) return "";

  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;

  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}

export function TweetCard({
  tweet,
  reply,
  onTextChange,
  onRegenerate,
  onSend,
}: TweetCardProps) {
  return (
    <div className="rounded-lg border p-3 shadow-sm">
      {/* Author info row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tweet.authorAvatar && (
            <img
              src={tweet.authorAvatar}
              alt={tweet.authorName}
              className="h-5 w-5 rounded-full"
            />
          )}
          <p className="text-xs font-medium">
            <XLink
              to={`https://x.com/${tweet.authorHandle}`}
              className="hover:underline"
            >
              @{tweet.authorHandle}
            </XLink>{" "}
            <span className="font-normal text-muted-foreground">
              {tweet.authorName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Source badge */}
          <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
            {tweet.sourceType === "list" ? (
              <List className="h-2.5 w-2.5" />
            ) : (
              <Users className="h-2.5 w-2.5" />
            )}
          </span>
          {/* Timestamp */}
          {tweet.timestamp && (
            <span className="text-[10px] text-muted-foreground">
              {relativeTime(tweet.timestamp)}
            </span>
          )}
          {/* External link */}
          <XLink
            to={tweet.url}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary"
            title="View on X"
          >
            <ExternalLink className="h-3 w-3" />
          </XLink>
        </div>
      </div>

      {/* Tweet text */}
      <p className="mt-1 text-sm">{tweet.text}</p>

      {/* Reply editor */}
      {reply && (
        <ReplyEditor
          reply={reply}
          onTextChange={onTextChange}
          onRegenerate={onRegenerate}
          onSend={onSend}
        />
      )}
    </div>
  );
}
