"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string | null;
  isAuthenticated: boolean;
  onSignInComplete?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  analysisId,
  isAuthenticated,
  onSignInComplete,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Analysis</DialogTitle>
            <DialogDescription>
              Sign in to save your analysis and get a shareable link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your analysis results will be saved automatically after signing in.
            </p>

            <SignInButton mode="modal">
              <Button className="w-full">Sign in to save</Button>
            </SignInButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If authenticated but no analysisId, show loading
  if (!analysisId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saving Analysis...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state with share link
  const shareUrl = `${window.location.origin}/tools/ai-comment-detect/${analysisId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  const handleView = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Analysis Saved!</DialogTitle>
          <DialogDescription>
            Your analysis has been saved and is ready to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted p-3">
            <code className="text-xs break-all">{shareUrl}</code>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button variant="default" className="flex-1" onClick={handleView}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
