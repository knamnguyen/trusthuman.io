"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";
import { CommentPreview } from "../_components/preview/comment-preview";
import { AnalysisPanel } from "../_components/analysis-panel";

export default function SharedAnalysisPage() {
  const params = useParams<{ id: string }>();
  const trpc = useTRPC();

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery({
    ...trpc.commentAiDetector.getById.queryOptions({ id: params.id }),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Analysis Not Found</h1>
          <p className="mb-6 text-gray-600">
            The analysis you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/tools/ai-comment-detect">
            <Button>Analyze a Comment</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Transform data for CommentPreview
  const commentData = {
    urn: analysis.commentUrl,
    author: {
      name: analysis.authorName,
      headline: analysis.authorHeadline || "",
      avatarUrl: analysis.avatarS3Url ?? "https://via.placeholder.com/100",
      profileUrl: analysis.authorProfileUrl || "",
    },
    text: analysis.commentText,
    reactions: {
      like: 0,
      total: 0,
    },
    timestamp: analysis.createdAt.toISOString(),
  };

  // Transform data for AnalysisPanel
  const analysisResult = {
    overallHumanScore: analysis.overallScore,
    blocks: (analysis.analysisJson as any).blocks.map((block: any) => ({
      text: block.text,
      aiProbability: Math.round(block.result.fake * 100),
      isLikelyHuman: block.result.fake <= 0.5,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">AI Comment Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Shared analysis by {analysis.user.firstName} {analysis.user.lastName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comment Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Comment</h2>
          <CommentPreview commentData={commentData} />
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Detection Results</h2>
          <AnalysisPanel analysisResult={analysisResult} isLoading={false} />
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/tools/ai-comment-detect">
          <Button>Analyze Your Own Comment</Button>
        </Link>
      </div>
    </div>
  );
}
