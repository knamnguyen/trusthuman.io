import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useSettingsLocalStore } from "../../stores/settings-local-store";

/**
 * Image manager component for the Settings Submit tab.
 * Allows users to upload a single local image for comment attachment.
 * Enforces 1/1 image limit.
 */
export function SettingsImageManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to local settings store (single image)
  const image = useSettingsLocalStore((state) => state.image);
  const imageLoaded = useSettingsLocalStore((state) => state.imageLoaded);
  const setImage = useSettingsLocalStore((state) => state.setImage);
  const removeImage = useSettingsLocalStore((state) => state.removeImage);

  // Handle file selection (single file only)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept images
    if (!file.type.startsWith("image/")) {
      console.warn("SettingsImageManager: File is not an image");
      return;
    }

    try {
      await setImage(file);
    } catch (error) {
      console.error("SettingsImageManager: Error setting image", error);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file picker
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  if (!imageLoaded) {
    return (
      <div className="border-muted rounded-md border border-dashed p-4">
        <p className="text-muted-foreground text-center text-xs">
          Loading image...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image preview (single image only) */}
      {image && (
        <div className="relative">
          <ImageThumbnail
            blobUrl={image.blobUrl}
            name={image.name}
            onRemove={removeImage}
          />
        </div>
      )}

      {/* Add/Replace button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleAddClick}
      >
        <ImagePlus className="mr-2 h-4 w-4" />
        {image ? "Replace Image" : "Add Image"}
      </Button>

      {/* Info text */}
      <p className="text-muted-foreground text-center text-[10px]">
        {image
          ? "1/1 image • Will be attached when enabled"
          : "Add an image to attach to comments"}
      </p>
    </div>
  );
}

/**
 * Individual image thumbnail with remove button
 */
function ImageThumbnail({
  blobUrl,
  name,
  onRemove,
}: {
  blobUrl?: string;
  name: string;
  onRemove: () => void;
}) {
  if (!blobUrl) return null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border">
      <img
        src={blobUrl}
        alt={name}
        className="h-full w-full object-cover"
      />
      {/* Remove button - visible on hover */}
      <button
        onClick={onRemove}
        className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
        title="Remove image"
      >
        <X className="h-3 w-3" />
      </button>
      {/* Name tooltip on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-[9px] text-white">{name}</p>
      </div>
    </div>
  );
}
