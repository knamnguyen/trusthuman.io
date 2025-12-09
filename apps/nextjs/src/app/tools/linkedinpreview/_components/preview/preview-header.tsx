"use client";

import React from "react";

import { Tabs, TabsList, TabsTrigger } from "@sassy/ui/tabs";

import type { Icons } from "../icons";
import { Icon } from "../icons";
import { useScreenSize } from "./preview-size-context";

export const PreviewHeader: React.FC = () => {
  const { screenSize, setScreenSize } = useScreenSize();

  return (
    <div className="flex min-h-16 border-b px-2 py-2 sm:px-4 sm:py-0 lg:px-6">
      <div className="flex w-full grow items-center justify-between gap-2">
        <h2 className="text-sm font-semibold sm:text-base">Post Preview</h2>
        <Tabs
          value={screenSize}
          onValueChange={(v) => setScreenSize(v as typeof screenSize)}
        >
          <TabsList className="h-8">
            {["mobile", "tablet", "desktop"].map((size) => (
              <TabsTrigger key={size} value={size} className="px-2">
                <Icon name={size as keyof typeof Icons} className="size-4" />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
