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

  return (
    <Card className="overflow-hidden">
      <img src={generation.s3Url} alt="" className="h-48 w-full object-cover" />
      <div className="flex flex-col items-center p-4">
        <h3 className="truncate font-semibold">
          {generation.title || "Untitled"}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {generation.contentText}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {formatDistanceToNow(new Date(generation.createdAt), {
            addSuffix: true,
          })}
        </p>
        <div className="mt-4 flex gap-2">
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
