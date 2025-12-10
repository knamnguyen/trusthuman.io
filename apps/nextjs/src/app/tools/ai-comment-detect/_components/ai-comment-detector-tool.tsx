"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";

import { useTRPC } from "~/trpc/react";
import { InputPanel } from "./input-panel";
import { AnalysisPanel } from "./analysis-panel";

export interface CommentData {
  urn: string;
  author: {
    name: string;
    headline: string;
    profileUrl: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: string;
  reactions: {
    like: number;
    total: number;
  };
}

export interface AnalysisResult {
  overallHumanScore: number;
  blocks: {
    text: string;
    isLikelyHuman: boolean;
    aiProbability: number;
  }[];
}

export function AICommentDetectorTool() {
  const [commentData, setCommentData] = useState<CommentData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const trpc = useTRPC();

  // Fetch comment from URN
  const fetchCommentMutation = useMutation(
    trpc.commentAiDetector.fetchCommentFromUrn.mutationOptions({}),
  );

  // Detect AI content in comment text
  const detectAIMutation = useMutation(
    trpc.commentAiDetector.detectAIContent.mutationOptions({}),
  );

  const handleFetchComment = async (url: string) => {
    setAnalysisResult(null); // Clear previous analysis

    try {
      const result = await fetchCommentMutation.mutateAsync({ url });

      if (!result.success) {
        toast.error(result.error?.message ?? "Failed to fetch comment");
        setCommentData(null);
        return;
      }

      if (!result.data) {
        toast.error("No data returned from server");
        setCommentData(null);
        return;
      }

      const { data } = result;

      // Map backend response to CommentData interface
      setCommentData({
        urn: data.comment.urn,
        author: {
          name: data.comment.author.name,
          headline: "", // Backend doesn't provide headline
          profileUrl: data.comment.author.profileUrl,
          avatarUrl: data.comment.author.avatarUrl ?? "",
        },
        text: data.comment.text,
        timestamp: data.comment.relativeTime ?? "",
        reactions: {
          like: data.comment.reactions,
          total: data.comment.reactions,
        },
      });

      toast.success("Comment fetched successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch comment. Please try again.";
      toast.error(errorMessage);
      setCommentData(null);
    }
  };

  const handleEvaluateComment = async () => {
    if (!commentData) return;

    try {
      const result = await detectAIMutation.mutateAsync({ text: commentData.text });

      if (!result.success) {
        toast.error(result.error?.message ?? "AI analysis failed");
        return;
      }

      if (!result.data) {
        toast.error("No analysis data returned from server");
        return;
      }

      const { data } = result;

      // Map backend AI analysis to AnalysisResult interface
      // Convert 0-1 scores to percentages
      const overallHumanScore = Math.round(data.original * 100);

      const blocks = data.blocks.map((block) => ({
        text: block.text,
        // If AI score (fake) is > 50%, it's likely AI-generated
        isLikelyHuman: block.result.fake <= 0.5,
        // Convert fake score to percentage
        aiProbability: Math.round(block.result.fake * 100),
      }));

      setAnalysisResult({
        overallHumanScore,
        blocks,
      });

      toast.success("AI analysis complete!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze comment. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Compute combined loading state for UI components
  const isFetching = fetchCommentMutation.isPending;
  const isAnalyzing = detectAIMutation.isPending;
  const isLoading = isFetching || isAnalyzing;

  return (
    <>
      <Toaster />
      <section
        id="ai-comment-detector-tool"
        className="container max-w-7xl px-2 py-4 sm:px-4 sm:py-8"
      >
        <div className="flex min-h-full flex-1 flex-col rounded-sm border lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">
            <InputPanel
              onFetchComment={handleFetchComment}
              onEvaluateComment={handleEvaluateComment}
              commentData={commentData}
              isLoading={isLoading}
            />
          </div>
          <div className="w-full min-w-0 flex-1 flex-col border-t lg:max-w-[600px] lg:border-t-0 lg:border-l">
            <AnalysisPanel analysisResult={analysisResult} isLoading={isLoading} />
          </div>
        </div>
      </section>
    </>
  );
}
