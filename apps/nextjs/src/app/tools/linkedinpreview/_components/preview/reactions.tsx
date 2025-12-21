"use client";

import React from "react";

import { cn } from "@sassy/ui/utils";

import { useScreenSize } from "./preview-size-context";

export const Reactions: React.FC = () => {
  const { screenSize } = useScreenSize();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center justify-start gap-2">
        <img
          alt="post reactions"
          loading="lazy"
          width={76}
          height={25}
          className="h-6 w-auto shrink-0"
          src="/tools/post-reactions.svg"
        />
        <span
          className={cn(
            "mt-1 shrink-0 font-medium text-gray-500",
            screenSize === "mobile" ? "hidden" : "text-xs",
          )}
        >
          Ky-Nam and 88 others
        </span>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        {["4 comments", "•", "1 repost"].map((text) => (
          <span
            key={text}
            className={cn(
              "font-medium whitespace-nowrap text-gray-500",
              screenSize === "mobile" ? "text-[10px]" : "text-xs",
            )}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
