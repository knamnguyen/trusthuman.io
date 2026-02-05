import { Loader2, RefreshCw, Send } from "lucide-react";

import { Button } from "@sassy/ui/button";

import type { ReplyState } from "../stores/replies-store";

interface ReplyEditorProps {
  reply: ReplyState;
  onTextChange: (text: string) => void;
  onRegenerate: () => void;
  onSend: () => void;
}

export function ReplyEditor({
  reply,
  onTextChange,
  onRegenerate,
  onSend,
}: ReplyEditorProps) {
  const isGenerating = reply.status === "generating";
  const isSending = reply.status === "sending";
  const isSent = reply.status === "sent";
  const hasError = reply.status === "error";
  const canSend = reply.status === "ready" && reply.text.trim().length > 0;

  return (
    <div className="mt-2 space-y-2">
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating reply...
        </div>
      )}

      {(reply.status === "ready" || hasError) && (
        <textarea
          value={reply.text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full resize-none rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          rows={2}
          placeholder="AI reply will appear here..."
        />
      )}

      {hasError && (
        <p className="text-xs text-destructive">{reply.error}</p>
      )}

      {isSent && (
        <div className="rounded-md bg-secondary/10 p-2 text-xs text-secondary">
          Reply sent successfully
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isGenerating || isSending || isSent}
          className="h-7 gap-1 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Regen
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSend}
          disabled={!canSend || isSending || isSent}
          className="h-7 gap-1 text-xs"
        >
          {isSending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {isSending ? "Sending..." : isSent ? "Sent" : "Send"}
        </Button>
      </div>
    </div>
  );
}
