"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { useTRPC } from "~/trpc/react";

interface AnalysisCardProps {
  analysis: {
    id: string;
    authorName: string;
    commentText: string;
    overallScore: number;
    createdAt: Date;
  };
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useMutation(
    trpc.commentAiDetector.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Analysis deleted successfully");
        // Invalidate the list query to refetch
        void queryClient.invalidateQueries({
          queryKey: trpc.commentAiDetector.list.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to delete: ${error.message}`);
        setIsDeleting(false);
      },
    }),
  );

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis?")) {
      return;
    }

    setIsDeleting(true);
    await deleteMutation.mutateAsync({ id: analysis.id });
  };

  const scoreColor =
    analysis.overallScore >= 70
      ? "text-green-600"
      : analysis.overallScore >= 40
        ? "text-yellow-600"
        : "text-red-600";

  const scoreLabel =
    analysis.overallScore >= 70
      ? "Likely Human"
      : analysis.overallScore >= 40
        ? "Mixed"
        : "Likely AI";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{analysis.authorName}</CardTitle>
        <CardDescription className="line-clamp-2">
          {analysis.commentText}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Overall Score:</span>
          <span className={`font-semibold ${scoreColor}`}>
            {Math.round(analysis.overallScore)}% {scoreLabel}
          </span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex gap-2">
        <Button asChild variant="outline" className="flex-1" size="sm">
          <Link href={`/tools/ai-comment-detect/${analysis.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
