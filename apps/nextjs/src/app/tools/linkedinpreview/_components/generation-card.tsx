"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sassy/ui/button";
import { Card } from "@sassy/ui/card";
import { useTRPC } from "~/trpc/react";

interface Generation {
  id: string;
  title: string | null;
  contentText: string;
  s3Url: string;
  createdAt: Date;
}

export function GenerationCard({ generation }: { generation: Generation }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);

  const { mutateAsync: deleteGeneration } = useMutation({
    ...trpc.linkedInPreview.delete.mutationOptions({}),
    onSuccess: async () => {
      // Invalidate and refetch the list
      await queryClient.invalidateQueries({
        queryKey: trpc.linkedInPreview.list.queryKey(),
      });
    },
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tools/linkedinpreview/${generation.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Delete this preview?")) {
      await deleteGeneration({ id: generation.id });
    }
  };

  return (
    <Card className="overflow-hidden">
      <img src={generation.s3Url} alt="" className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold truncate">{generation.title || "Untitled"}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
          {generation.contentText}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(generation.createdAt), { addSuffix: true })}
        </p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            {isCopied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
