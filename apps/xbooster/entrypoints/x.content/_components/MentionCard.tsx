import { ExternalLink, MessageSquare, X } from "lucide-react";

import type { MentionData, OriginalTweet } from "../stores/mentions-store";
import type { ReplyState } from "../stores/replies-store";
import { ReplyEditor } from "./ReplyEditor";
import { XLink } from "./XLink";

interface MentionCardProps {
  mention: MentionData;
  originalTweet: OriginalTweet | undefined;
  reply: ReplyState | undefined;
  onTextChange: (text: string) => void;
  onRegenerate: () => void;
  onSend: () => void;
  onRemove?: () => void;
}

export function MentionCard({
  mention,
  originalTweet,
  reply,
  onTextChange,
  onRegenerate,
  onSend,
  onRemove,
}: MentionCardProps) {
  const tweetUrl = `https://x.com/${mention.authorHandle}/status/${mention.tweetId}`;

  return (
    <div className="relative rounded-lg border p-3 shadow-sm">
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remove from queue"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Original tweet context */}
      {originalTweet && (
        <div className="mb-2 rounded-md bg-muted p-2">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            Original tweet
          </div>
          <p className="text-xs font-medium">
            @{originalTweet.authorHandle}{" "}
            <span className="font-normal text-muted-foreground">
              {originalTweet.authorName}
            </span>
          </p>
          <p className="mt-0.5 text-xs">{originalTweet.text}</p>
        </div>
      )}

      {/* Mention */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">
            @{mention.authorHandle}{" "}
            <span className="font-normal text-muted-foreground">
              {mention.authorName}
            </span>
          </p>
          <XLink
            to={tweetUrl}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary"
            title="View on X"
          >
            <ExternalLink className="h-3 w-3" />
          </XLink>
        </div>
        <p className="mt-0.5 text-sm">{mention.text}</p>
      </div>

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
