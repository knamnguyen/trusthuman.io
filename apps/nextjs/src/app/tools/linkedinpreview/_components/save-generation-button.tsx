"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@sassy/ui/button";
import { useTRPC } from "~/trpc/react";

interface Props {
  contentJson: any;
  contentText: string;
  imageFile: File | null;
  title?: string;
}

export function SaveGenerationButton({ contentJson, contentText, imageFile, title }: Props) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const trpc = useTRPC();

  const { mutateAsync: generatePresignedUrl } = useMutation(
    trpc.linkedInPreview.generatePresignedUrl.mutationOptions({})
  );
  const { mutateAsync: saveResult } = useMutation(
    trpc.linkedInPreview.saveResult.mutationOptions({})
  );

  const handleSave = async () => {
    if (!imageFile) {
      alert("Please upload an image first");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get presigned URL
      const { presignedUrl, s3Key, s3Url } = await generatePresignedUrl({
        fileName: imageFile.name,
        contentType: imageFile.type,
      });

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3");
      }

      // Step 3: Save metadata
      const generation = await saveResult({
        s3Key,
        s3Url,
        contentJson,
        contentText,
        title,
      });

      // Redirect to saved generation
      router.push(`/tools/linkedinpreview/${generation.id}`);
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>Sign in to Save</Button>
      </SignInButton>
    );
  }

  return (
    <Button onClick={handleSave} disabled={isUploading || !imageFile}>
      {isUploading ? "Saving..." : "Save and share preview"}
    </Button>
  );
}
