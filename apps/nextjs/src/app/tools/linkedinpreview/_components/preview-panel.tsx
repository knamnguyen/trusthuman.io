"use client";

import React from "react";

import { cn } from "@sassy/ui/utils";

import { ActionButtons } from "./preview/action-buttons";
import { ContentSection } from "./preview/content-section";
import { PreviewHeader } from "./preview/preview-header";
import {
  ScreenSizeProvider,
  useScreenSize,
} from "./preview/preview-size-context";
import { Reactions } from "./preview/reactions";
import { UserInfo } from "./preview/user-info";

interface PreviewPanelProps {
  content: any;
  image: string | null;
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({
  content,
  image,
}) => {
  const { screenSize } = useScreenSize();

  const containerWidth = {
    mobile: "w-full",
    tablet: "w-[480px]",
    desktop: "w-[555px]",
  };

  return (
    <div className="flex h-full max-h-[600px] flex-col lg:h-full lg:max-h-none">
      <PreviewHeader />
      <div className="flex flex-1 flex-col items-center gap-5 overflow-y-auto bg-gray-50 py-2 sm:py-5">
        <div
          className={cn(
            "mx-auto w-full transition-all duration-300",
            screenSize === "mobile" ? "px-2" : "",
            containerWidth[screenSize],
          )}
        >
          <div className="font-system w-full overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200 ring-inset">
            <div className="overflow-x-hidden py-3 pr-3 pl-3 sm:py-5 sm:pr-6 sm:pl-4">
              <UserInfo />
              <ContentSection content={content} />
            </div>
            {image && (
              <div className="relative w-full">
                <img
                  src={image}
                  alt="Post"
                  className="w-full object-cover"
                  style={{ maxHeight: "600px", objectFit: "contain" }}
                />
              </div>
            )}
            <div className="py-3 pr-3 pl-3 sm:py-3 sm:pr-6 sm:pl-4">
              <Reactions />
              <hr className="mt-3 border-gray-200" />
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  content,
  image,
}) => {
  return (
    <ScreenSizeProvider>
      <PreviewPanelContent content={content} image={image} />
    </ScreenSizeProvider>
  );
};
