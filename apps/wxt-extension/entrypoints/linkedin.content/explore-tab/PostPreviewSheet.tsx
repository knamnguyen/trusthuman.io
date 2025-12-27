import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";
import { ScrollArea } from "@sassy/ui/scroll-area";

import { useComposeStore } from "../stores/compose-store";

/**
 * Panel that displays post details when clicking "View" on a compose card.
 * Reads pre-extracted author info and caption from the store (extracted during collection).
 * Positioning is handled by wrapper div in ExploreTab (absolute left-0 -translate-x-full).
 */
export function PostPreviewSheet() {
  const { cards, previewingCardId, setPreviewingCard } = useComposeStore();

  // Find the card being previewed - authorInfo and fullCaption are pre-extracted
  const previewingCard = useMemo(() => {
    if (!previewingCardId) return null;
    return cards.find((c) => c.id === previewingCardId) || null;
  }, [cards, previewingCardId]);

  // Get author info, caption, post time, and post URL from the card (already extracted during collection)
  const authorInfo = previewingCard?.authorInfo ?? null;
  const fullCaption = previewingCard?.fullCaption ?? "";
  const postTime = previewingCard?.postTime ?? null;
  const postUrl = previewingCard?.postUrl ?? null;

  const handleClose = () => {
    setPreviewingCard(null);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  const isOpen = !!previewingCardId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-background pointer-events-auto flex h-full w-[600px] flex-col border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Post Preview</h2>
              {postUrl?.url && (
                <a
                  href={postUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Open post on LinkedIn"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {previewingCard && authorInfo && (
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-4 p-4">
                {/* Author Section */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={authorInfo.photoUrl || undefined}
                      alt={authorInfo.name || "Author"}
                    />
                    <AvatarFallback>
                      {getInitials(authorInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {authorInfo.name || "Unknown Author"}
                      </p>
                      {postTime?.displayTime && (
                        <span
                          className="text-muted-foreground text-xs"
                          title={postTime.fullTime || undefined}
                        >
                          • {postTime.displayTime}
                        </span>
                      )}
                    </div>
                    {authorInfo.headline && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {authorInfo.headline}
                      </p>
                    )}
                    {authorInfo.profileUrl && (
                      <a
                        href={authorInfo.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>

                {/* Post Caption */}
                <div className="border-t pt-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                    Post Content
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {fullCaption || previewingCard.captionPreview}
                  </p>
                </div>

                {/* Comments Section */}
                {previewingCard.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                      Comments ({previewingCard.comments.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {previewingCard.comments.map((comment, index) => (
                        <div
                          key={comment.urn || index}
                          className={`rounded-md border p-3 ${comment.isReply ? "ml-4 bg-muted/50" : "bg-muted/30"}`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {comment.authorPhotoUrl && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={comment.authorPhotoUrl}
                                  alt={comment.authorName || "Commenter"}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(comment.authorName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {comment.authorName || "Unknown"}
                              </p>
                              {comment.authorHeadline && (
                                <p className="text-muted-foreground truncate text-[10px]">
                                  {comment.authorHeadline}
                                </p>
                              )}
                            </div>
                          </div>
                          {comment.content && (
                            <p className="text-xs">{comment.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Focus on Post Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    previewingCard.postContainer.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    // Highlight effect
                    const prevOutline =
                      previewingCard.postContainer.style.outline;
                    previewingCard.postContainer.style.outline =
                      "3px solid #ec4899";
                    setTimeout(() => {
                      previewingCard.postContainer.style.outline = prevOutline;
                    }, 2000);
                  }}
                >
                  Focus on Post
                </Button>
              </div>
            </ScrollArea>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
