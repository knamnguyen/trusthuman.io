"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sassy/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import { useTRPC } from "~/trpc/react";

interface Props {
  contentJson: any;
  contentText: string;
  imageFile: File | null;
  title?: string;
}

export function SaveGenerationButton({ contentJson, contentText, imageFile, title }: Props) {
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [savedGenerationId, setSavedGenerationId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const trpc = useTRPC();

  const { mutateAsync: generatePresignedUrl } = useMutation(
    trpc.linkedInPreview.generatePresignedUrl.mutationOptions({})
  );
  const { mutateAsync: saveResult } = useMutation(
    trpc.linkedInPreview.saveResult.mutationOptions({})
  );

  const handleSave = async () => {
    setIsUploading(true);

    try {
      let s3Key = "";
      let s3Url = "";

      // Only upload image if one exists
      if (imageFile) {
        // Step 1: Get presigned URL
        const presignedData = await generatePresignedUrl({
          fileName: imageFile.name,
          contentType: imageFile.type,
        });
        s3Key = presignedData.s3Key;
        s3Url = presignedData.s3Url;

        // Step 2: Upload to S3
        const uploadResponse = await fetch(presignedData.presignedUrl, {
          method: "PUT",
          body: imageFile,
          headers: {
            "Content-Type": imageFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to S3");
        }
      }

      // Step 3: Save metadata (with or without image)
      const generation = await saveResult({
        s3Key,
        s3Url,
        contentJson,
        contentText,
        title,
      });

      // Invalidate and refetch the generation list
      await queryClient.invalidateQueries({
        queryKey: trpc.linkedInPreview.list.queryKey(),
      });

      // Show dialog instead of redirecting
      setSavedGenerationId(generation.id);
      setShowDialog(true);
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = () => {
    if (!savedGenerationId) return;
    const url = `${window.location.origin}/tools/linkedinpreview/${savedGenerationId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSeePreview = () => {
    if (!savedGenerationId) return;
    window.open(`/tools/linkedinpreview/${savedGenerationId}`, "_blank");
    setShowDialog(false);
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>Sign in to Save</Button>
      </SignInButton>
    );
  }

  return (
    <>
      <Button onClick={handleSave} disabled={isUploading}>
        {isUploading ? "Saving..." : "Save and share preview"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview saved successfully!</DialogTitle>
            <DialogDescription>
              Your LinkedIn preview has been saved. You can copy the link to share or view the preview.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCopyLink}>
              {isCopied ? "Copied!" : "Copy link"}
            </Button>
            <Button onClick={handleSeePreview}>
              See preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
