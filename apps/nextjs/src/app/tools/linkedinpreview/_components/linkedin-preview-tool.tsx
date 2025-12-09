"use client";

import React, { useState } from "react";
import { Toaster } from "sonner";

import { EditorPanel } from "./editor-panel";
import { PreviewPanel } from "./preview-panel";
import { processNodes, toPlainText } from "./utils";

export function LinkedInPreviewTool() {
  const [content, setContent] = useState<any>(null);
  const [contentText, setContentText] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleContentChange = (json: any) => {
    setContent(json);
    // Convert JSON to plain text for saving
    const textContent = toPlainText(processNodes(json).content || []);
    setContentText(textContent);
  };

  const handleImageChange = (imageSrc: string | null, file: File | null) => {
    setImage(imageSrc);
    setImageFile(file);
  };

  return (
    <>
      <Toaster />
      <section
        id="linkedin-preview-tool"
        className="container max-w-7xl px-2 py-4 sm:px-4 sm:py-8"
      >
        <div className="flex min-h-full flex-1 flex-col rounded-sm border lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">
            <EditorPanel
              onChange={handleContentChange}
              onImageChange={handleImageChange}
              contentJson={content}
              contentText={contentText}
              imageFile={imageFile}
            />
          </div>
          <div className="w-full min-w-0 flex-1 flex-col border-t lg:max-w-[600px] lg:border-t-0 lg:border-l">
            <PreviewPanel content={content} image={image} />
          </div>
        </div>
      </section>
    </>
  );
}
