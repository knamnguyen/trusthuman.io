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
        className="container max-w-7xl py-16 md:py-24"
      >
        <div className="flex min-h-[520px] flex-1 rounded-sm border">
          <div className="flex flex-1 flex-col">
            <EditorPanel
              onChange={handleContentChange}
              onImageChange={handleImageChange}
              contentJson={content}
              contentText={contentText}
              imageFile={imageFile}
            />
          </div>
          <div className="hidden w-full max-w-[600px] flex-1 flex-col border-l md:flex">
            <PreviewPanel content={content} image={image} />
          </div>
        </div>
      </section>
    </>
  );
}
