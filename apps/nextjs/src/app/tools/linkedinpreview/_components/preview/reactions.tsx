"use client";

import React from "react";

import { cn } from "@sassy/ui/utils";

import { useScreenSize } from "./preview-size-context";

export const Reactions: React.FC = () => {
  const { screenSize } = useScreenSize();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-start gap-2">
        <img
          alt="post reactions"
          loading="lazy"
          width={24}
          height={24}
          className="h-5 w-auto"
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciI+CjxwYXRoIGQ9Ik04OC40MSA4NC42N2EzMS45MyAzMS45MyAwIDAwMjQuNDEtMTEuMzMgNjYuMTMgNjYuMTMgMCAwMC00OC44MiAwQTMxLjkzIDMxLjkzIDAgMDA2NCA5NnoiIGZpbGw9IiM1NjY4N2EiLz4KPC9zdmc+"
        />
        <span
          className={cn(
            "mt-1 font-medium text-gray-500",
            screenSize === "mobile" ? "hidden" : "text-xs",
          )}
        >
          Devv and 88 others
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        {["4 comments", "•", "1 repost"].map((text) => (
          <span
            key={text}
            className={cn(
              "font-medium text-gray-500",
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
