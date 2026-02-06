import { ExternalLink, MessageSquare, ThumbsUp, Trash2 } from "lucide-react";
import { navigateLinkedIn } from "@sassy/linkedin-automation/navigate/navigate-linkedin";
import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import type { LinkedInMention } from "./types";

interface MentionCardProps {
  mention: LinkedInMention;
  onRemove: (entityUrn: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMonth > 0) return `${diffMonth}mo ago`;
  if (diffWeek > 0) return `${diffWeek}w ago`;
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

export function MentionCard({ mention, onRemove }: MentionCardProps) {
  const relativeTime = formatRelativeTime(mention.publishedAt);

  return (
    <Card>
      <CardContent className="flex gap-2 p-3">
        {/* Left: Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Header: Avatar + Name + Time + Engagement + Badge */}
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage
                src={mention.mentionerPhotoUrl || undefined}
                alt={mention.mentionerName}
              />
              <AvatarFallback className="text-[10px]">
                {getInitials(mention.mentionerName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">
              {mention.mentionerName}
            </span>
            <span className="text-muted-foreground text-[10px]">•</span>
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {relativeTime}
            </span>
            {mention.numLikes !== null && (
              <>
                <span className="text-muted-foreground text-[10px]">•</span>
                <div className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[10px]">
                  <ThumbsUp className="h-2.5 w-2.5" />
                  <span>{mention.numLikes}</span>
                </div>
              </>
            )}
            {mention.numComments !== null && (
              <div className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[10px]">
                <MessageSquare className="h-2.5 w-2.5" />
                <span>{mention.numComments}</span>
              </div>
            )}
            {!mention.read && (
              <Badge
                variant="default"
                className="ml-auto shrink-0 px-1.5 py-0 text-[10px]"
              >
                New
              </Badge>
            )}
          </div>

          {/* Comment Text */}
          <p className="line-clamp-2 text-sm">{mention.commentText}</p>

          {/* Post Snippet */}
          {mention.postSnippet && (
            <div className="bg-muted/30 rounded-md px-2 py-1 text-[11px] text-muted-foreground">
              <p className="line-clamp-2">{mention.postSnippet}</p>
            </div>
          )}
        </div>

        {/* Right: Stacked action buttons */}
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateLinkedIn(mention.postUrl)}
            title="Go to post"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-8 w-8"
            onClick={() => onRemove(mention.entityUrn)}
            title="Remove mention"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
