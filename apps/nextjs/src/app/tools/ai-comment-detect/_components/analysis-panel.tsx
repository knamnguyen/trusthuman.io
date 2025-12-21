"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@sassy/ui/utils";

import type { AnalysisResult } from "./ai-comment-detector-tool";

interface AnalysisPanelProps {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
}

export function AnalysisPanel({ analysisResult, isLoading }: AnalysisPanelProps) {
  if (isLoading && !analysisResult) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-sm text-muted-foreground">Analyzing comment...</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 size-12 text-gray-300" />
          <p className="text-sm text-muted-foreground">
            Fetch a comment and click "Evaluate Comment" to see analysis results
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-50 border-green-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Analysis Results</h3>
      </div>

      {/* Overall Score */}
      <div
        className={cn(
          "rounded-lg border-2 p-6 text-center",
          getScoreBgColor(analysisResult.overallHumanScore),
        )}
      >
        <div className="mb-2 text-sm font-medium text-gray-700">
          Overall Human Score
        </div>
        <div className={cn("text-5xl font-bold", getScoreColor(analysisResult.overallHumanScore))}>
          {analysisResult.overallHumanScore}%
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {analysisResult.overallHumanScore >= 70
            ? "Likely written by a human"
            : analysisResult.overallHumanScore >= 40
              ? "Mixed human and AI indicators"
              : "Likely AI-generated"}
        </div>
      </div>

      {/* Block Analysis */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Detailed Analysis by Text Block
        </h4>
        {analysisResult.blocks.map((block, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg border p-4",
              block.isLikelyHuman
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50",
            )}
          >
            <div className="mb-2 text-sm text-gray-800">"{block.text}"</div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold",
                  block.isLikelyHuman ? "text-green-700" : "text-red-700",
                )}
              >
                {block.isLikelyHuman ? "LIKELY HUMAN" : "LIKELY AI"}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  block.isLikelyHuman ? "text-green-600" : "text-red-600",
                )}
              >
                AI PROB: {block.aiProbability}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
