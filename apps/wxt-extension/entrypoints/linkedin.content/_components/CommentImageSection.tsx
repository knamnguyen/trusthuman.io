import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Label } from "@sassy/ui/label";
import { Progress } from "@sassy/ui/progress";
import { Switch } from "@sassy/ui/switch";

import { useTRPC } from "../../../lib/trpc/client";
import { useCommentImageStore } from "../stores";

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

/**
 * Image upload and management section for ComposeTab
 * Allows users to upload images that can be randomly attached to comments
 */
export function CommentImageSection() {
  const trpc = useTRPC();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const {
    images,
    isLoading,
    attachImageEnabled,
    loadImages,
    addImage,
    removeImage,
    setAttachImageEnabled,
  } = useCommentImageStore();

  // Load images from storage on mount
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Get presigned URL mutation
  const getUploadUrl = useMutation(
    trpc.s3Upload.getUploadUrl.mutationOptions(),
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      for (const file of files) {
        // Validate file type
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
          console.error("EngageKit: Invalid file type", file.type);
          continue;
        }

        const uploadId = `${file.name}-${Date.now()}`;

        // Add to uploading state
        setUploadingFiles((prev) => [
          ...prev,
          { id: uploadId, name: file.name, progress: 10 },
        ]);

        try {
          // Update progress - getting presigned URL
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress: 30 } : f)),
          );

          // 1. Get presigned URL from server
          const { presignedUrl, s3Url } = await getUploadUrl.mutateAsync({
            folder: "comment-images",
            fileName: file.name,
            contentType: file.type,
          });

          // Update progress - uploading to S3
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress: 60 } : f)),
          );

          // 2. Upload directly to S3
          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          // Update progress - completed
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress: 100 } : f)),
          );

          // 3. Save to local storage
          await addImage(s3Url, file.name);

          // Remove from uploading state
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
          }, 500);

          console.log("EngageKit: Image uploaded successfully", s3Url);
        } catch (error) {
          console.error("EngageKit: Failed to upload image", error);
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        }
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [getUploadUrl, addImage],
  );

  const isUploading = uploadingFiles.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImagePlus className="h-4 w-4" />
              Comment Images
            </CardTitle>
            <CardDescription className="text-xs">
              Random image attached when commenting
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="attach-image-toggle" className="text-xs">
              Enabled
            </Label>
            <Switch
              id="attach-image-toggle"
              checked={attachImageEnabled}
              onCheckedChange={setAttachImageEnabled}
              disabled={isLoading || images.length === 0}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>

        {/* Upload progress */}
        {uploadingFiles.map((file) => (
          <div key={file.id} className="space-y-1">
            <p className="text-muted-foreground truncate text-xs">{file.name}</p>
            <Progress value={file.progress} className="h-1.5" />
          </div>
        ))}

        {/* Stored images grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((image) => (
              <div key={image.id} className="group relative">
                <img
                  src={image.s3Url}
                  alt={image.name}
                  className="h-20 w-full rounded-md border object-cover"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-xs py-2">
            No images uploaded yet
          </p>
        )}

        {/* Info text */}
        {images.length > 0 && attachImageEnabled && (
          <p className="text-muted-foreground text-center text-xs">
            1 random image will be attached to each comment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
