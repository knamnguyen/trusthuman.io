"use client";

import React from "react";
import { MessageCircle, ThumbsUp } from "lucide-react";

import type { CommentData } from "../ai-comment-detector-tool";

interface CommentPreviewProps {
  commentData: CommentData;
}

export function CommentPreview({ commentData }: CommentPreviewProps) {
  return (
    <div className="font-system w-full overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="p-4">
        {/* Author Info */}
        <div className="flex items-start gap-3">
          <img
            src={commentData.author.avatarUrl}
            alt={commentData.author.name}
            className="size-10 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <a
                href={commentData.author.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline"
              >
                {commentData.author.name}
              </a>
            </div>
            <p className="text-xs text-gray-600">{commentData.author.headline}</p>
            <p className="text-xs text-gray-500">{commentData.timestamp}</p>
          </div>
        </div>

        {/* Comment Text */}
        <div className="mt-3">
          <p className="whitespace-pre-wrap text-sm text-gray-900">
            {commentData.text}
          </p>
        </div>

        {/* Reactions Bar */}
        <div className="mt-3 flex items-center gap-4 border-t pt-2">
          <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
            <ThumbsUp className="size-4" />
            <span>Like</span>
            {commentData.reactions.like > 0 && (
              <span className="font-medium">({commentData.reactions.like})</span>
            )}
          </button>
          <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
            <MessageCircle className="size-4" />
            <span>Reply</span>
          </button>
          {commentData.reactions.total > 0 && (
            <span className="ml-auto text-xs text-gray-500">
              {commentData.reactions.total} reactions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
