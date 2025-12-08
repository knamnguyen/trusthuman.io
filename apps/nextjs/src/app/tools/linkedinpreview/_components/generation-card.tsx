"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { Card } from "@sassy/ui/card";

interface Generation {
  id: string;
  title: string | null;
  contentText: string;
  s3Url: string;
  createdAt: Date;
}

export function GenerationCard({ generation }: { generation: Generation }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tools/linkedinpreview/${generation.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSeePreview = () => {
    window.open(`/tools/linkedinpreview/${generation.id}`, "_blank");
  };

  // Extract first 5 words as title, next 15 as description
  const words = generation.contentText.trim().split(/\s+/);
  const titleWords = words.slice(0, 5);
  const descriptionWords = words.slice(5, 20); // 5 + 15 = 20

  const displayTitle = titleWords.length > 0
    ? titleWords.join(" ") + (words.length > 5 ? "..." : "")
    : generation.title || "Untitled";

  const displayDescription = descriptionWords.length > 0
    ? descriptionWords.join(" ") + (words.length > 20 ? "..." : "")
    : "";

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {generation.s3Url && (
        <img src={generation.s3Url} alt="" className="h-48 w-full flex-shrink-0 object-cover" />
      )}
      <div className="flex flex-grow flex-col p-4">
        <div className="flex-grow text-center">
          <h3 className="w-full overflow-hidden text-ellipsis font-semibold">
            {displayTitle}
          </h3>
          {displayDescription && (
            <p className="mt-1 w-full break-words text-sm text-gray-500 line-clamp-2">
              {displayDescription}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {formatDistanceToNow(new Date(generation.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            <Copy className="size-4" />
            {isCopied ? "Copied!" : "Link"}
          </Button>
          <Button size="sm" onClick={handleSeePreview}>
            <ExternalLink className="size-4" />
            View
          </Button>
        </div>
      </div>
    </Card>
  );
}
