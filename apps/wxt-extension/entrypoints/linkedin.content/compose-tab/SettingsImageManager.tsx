import { useEffect, useRef } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";

import { Button } from "@sassy/ui/button";

import {
  useCommentImageStore,
  type CommentImage,
} from "../stores/comment-image-store";

/**
 * Image manager component for the Settings Submit tab.
 * Allows users to upload local images and manage their image library.
 */
export function SettingsImageManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to image store
  const images = useCommentImageStore((state) => state.images);
  const isLoading = useCommentImageStore((state) => state.isLoading);
  const loadImages = useCommentImageStore((state) => state.loadImages);
  const addLocalImage = useCommentImageStore((state) => state.addLocalImage);
  const removeImage = useCommentImageStore((state) => state.removeImage);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of files) {
      // Only accept images
      if (!file.type.startsWith("image/")) continue;
      addLocalImage(file);
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

  if (isLoading) {
    return (
      <div className="border-muted rounded-md border border-dashed p-4">
        <p className="text-muted-foreground text-center text-xs">
          Loading images...
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
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              onRemove={() => removeImage(image.id)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleAddClick}
      >
        <ImagePlus className="mr-2 h-4 w-4" />
        Add Image
      </Button>

      {/* Info text */}
      <p className="text-muted-foreground text-center text-[10px]">
        {images.length === 0
          ? "Add images to attach randomly to comments"
          : `${images.length} image${images.length !== 1 ? "s" : ""} • A random one will be attached to each comment`}
      </p>
    </div>
  );
}

/**
 * Individual image thumbnail with remove button
 */
function ImageThumbnail({
  image,
  onRemove,
}: {
  image: CommentImage;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border">
      <img
        src={image.url}
        alt={image.name}
        className="h-full w-full object-cover"
      />
      {/* Local indicator badge */}
      {image.isLocal && (
        <span className="absolute top-1 left-1 rounded bg-blue-500/80 px-1 py-0.5 text-[8px] text-white">
          Local
        </span>
      )}
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
        <p className="truncate text-[9px] text-white">{image.name}</p>
      </div>
    </div>
  );
}
