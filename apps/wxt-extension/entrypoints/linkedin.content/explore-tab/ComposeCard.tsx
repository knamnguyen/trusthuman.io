import { memo, useCallback } from "react";
import { Eye, ExternalLink, RefreshCw, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import { Textarea } from "@sassy/ui/textarea";

import type { ComposeCard as ComposeCardType } from "../stores/compose-store";
import { useComposeStore } from "../stores/compose-store";

interface ComposeCardProps {
  card: ComposeCardType;
}

/**
 * Memoized compose card component.
 * Uses selective store subscriptions to prevent re-renders when other cards are added.
 */
export const ComposeCard = memo(function ComposeCard({ card }: ComposeCardProps) {
  // Use selective subscriptions to avoid re-renders when cards array changes
  const updateCardText = useComposeStore((state) => state.updateCardText);
  const removeCard = useComposeStore((state) => state.removeCard);
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateCardText(card.id, e.target.value);
    },
    [card.id, updateCardText],
  );

  const handleFocus = useCallback(() => {
    // Scroll to the post and highlight it briefly
    card.postContainer.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight effect
    const prevOutline = card.postContainer.style.outline;
    card.postContainer.style.outline = "3px solid #ec4899";
    setTimeout(() => {
      card.postContainer.style.outline = prevOutline;
    }, 2000);
  }, [card.postContainer]);

  const handleRemove = useCallback(() => {
    removeCard(card.id);
  }, [card.id, removeCard]);

  // Get initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  const authorInfo = card.authorInfo;

  return (
    <Card className="relative">
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Compact Author + Caption Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage
              src={authorInfo?.photoUrl || undefined}
              alt={authorInfo?.name || "Author"}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(authorInfo?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">
                {authorInfo?.name || "Unknown"}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-muted-foreground text-[10px] truncate flex-1">
                {card.captionPreview}
              </span>
            </div>
          </div>
          <Badge
            variant={card.status === "sent" ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {card.status === "sent" ? "Sent" : "Draft"}
          </Badge>
        </div>

        {/* Textarea - main focus */}
        <Textarea
          value={card.commentText}
          onChange={handleTextChange}
          placeholder="Write your comment..."
          className="min-h-[80px] text-sm resize-none"
          disabled={isSubmitting}
        />
        <div className="flex gap-2">
          {/* View - opens post preview sheet */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewingCard(card.id)}
            className="flex-1"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View
          </Button>
          {/* Regenerate - regenerate comment (placeholder) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => console.log("Regenerate clicked - placeholder")}
            title="Regenerate comment"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          {/* Focus - scroll to post */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFocus}
            title="Focus on post"
          >
            <Eye className="h-3 w-3" />
          </Button>
          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleRemove}
            disabled={isSubmitting}
            title="Remove card"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
