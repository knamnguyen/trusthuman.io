"use client";

import React, { useState } from "react";

import { Button } from "@sassy/ui/button";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";

import { CommentPreview } from "./preview/comment-preview";
import type { CommentData } from "./ai-comment-detector-tool";

interface InputPanelProps {
  onFetchComment: (urn: string) => void;
  onEvaluateComment: () => void;
  commentData: CommentData | null;
  isLoading: boolean;
}

export function InputPanel({
  onFetchComment,
  onEvaluateComment,
  commentData,
  isLoading,
}: InputPanelProps) {
  const [urnInput, setUrnInput] = useState("");

  const handleFetch = () => {
    if (urnInput.trim()) {
      onFetchComment(urnInput.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">AI Comment Detector</h2>
        <p className="text-sm text-muted-foreground">
          Analyze LinkedIn comments to detect AI-generated content
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comment-urn">LinkedIn Comment URN URL</Label>
          <div className="flex gap-2">
            <Input
              id="comment-urn"
              type="text"
              placeholder="Enter LinkedIn comment URN..."
              value={urnInput}
              onChange={(e) => setUrnInput(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleFetch} disabled={isLoading || !urnInput.trim()}>
              {isLoading && !commentData ? "Fetching..." : "Fetch"}
            </Button>
          </div>
        </div>

        {commentData && (
          <>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Comment Preview</h3>
              <CommentPreview commentData={commentData} />
            </div>

            <Button
              onClick={onEvaluateComment}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Evaluating..." : "Evaluate Comment"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
