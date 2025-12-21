"use client";

import React from "react";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";

import { EditorLoading } from "./editor-loading";
import { Icon } from "./icons";
import { SaveGenerationButton } from "./save-generation-button";
import { Toolbar } from "./toolbar";
import { processNodes, toPlainText } from "./utils";

const listStyles = `
  .ProseMirror {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
    overflow-x: hidden;
  }
  .ProseMirror * {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
  }
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5em;
  }
  .ProseMirror ul > li {
    list-style-type: disc;
  }
  .ProseMirror ol > li {
    list-style-type: decimal;
  }
`;

export function EditorPanel({
  onChange,
  onImageChange,
  contentJson,
  contentText,
  imageFile,
}: {
  onChange: (json: any) => void;
  onImageChange: (imageSrc: string | null, file: File | null) => void;
  contentJson?: any;
  contentText?: string;
  imageFile?: File | null;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);
  const [currentFile, setCurrentFile] = React.useState<File | null>(null);

  const handleImageChangeWrapper = React.useCallback(
    (imageSrc: string | null, file: File | null) => {
      setCurrentImage(imageSrc);
      setCurrentFile(file);
      onImageChange(imageSrc, file);
    },
    [onImageChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Write something …",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose-md focus:outline-none resize-none block w-full p-0 text-gray-900 border-none appearance-none placeholder:text-gray-500 focus:ring-0 overflow-y-auto overflow-x-hidden h-full break-words",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  const handleCopy = React.useCallback(() => {
    if (!editor) return;

    const textContent = toPlainText(
      processNodes(editor.getJSON()).content || [],
    );

    navigator.clipboard
      .writeText(textContent)
      .then(() => toast.success("Text copied to clipboard"))
      .catch((err) => toast.error(`Failed to copy text: ${err}`));
  }, [editor]);

  React.useEffect(() => {
    const interceptCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      handleCopy();
    };

    document.addEventListener("copy", interceptCopy);
    return () => document.removeEventListener("copy", interceptCopy);
  }, [handleCopy]);

  const handleImageUpload = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          handleImageChangeWrapper(src, file);
          toast.success("Image added successfully");
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImageChangeWrapper],
  );

  const handleRemoveImage = React.useCallback(() => {
    handleImageChangeWrapper(null, null);
    toast.success("Image removed");
  }, [handleImageChangeWrapper]);

  if (!editor) {
    return <EditorLoading />;
  }

  return (
    <div className="flex size-full flex-col">
      <style>{listStyles}</style>
      {/** Panel title */}
      <div className="flex min-h-16 border-b px-2 py-2 sm:px-4 sm:py-0 lg:px-6">
        <div className="flex w-full items-center justify-start overflow-x-auto">
          <Toolbar editor={editor} />
        </div>
      </div>

      {/** Editor */}
      <div className="grow overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-4 sm:py-5 lg:px-6">
        <div className="not-prose relative min-w-0 text-sm font-normal">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/** Actions */}
      <div className="border-t px-2 py-2 sm:px-4 sm:py-3 lg:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center justify-center gap-2 overflow-x-auto sm:justify-start">
            <div className="group relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast.info("Feature not available yet")}
              >
                <Icon name="emoji" className="size-4" />
              </Button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 group-hover:scale-100">
                Insert Emoji
              </span>
            </div>

            <div className="group relative shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {currentImage ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveImage}
                  title="Remove Image"
                >
                  <Icon name="image" className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleImageUpload}
                >
                  <Icon name="image" className="size-4" />
                </Button>
              )}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 group-hover:scale-100">
                {currentImage ? "Remove Image" : "Add Image"}
              </span>
            </div>

            <div className="group relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast.info("Feature not available yet")}
              >
                <Icon name="carousel" className="size-4" />
              </Button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 group-hover:scale-100">
                Add Carousel
              </span>
            </div>

            <div className="group relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast.info("Feature not available yet")}
              >
                <Icon name="magic" className="size-4" />
              </Button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 group-hover:scale-100">
                Rewrite with AI
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="w-full sm:w-auto"
            >
              <Icon name="copy" className="mr-2 size-4" />
              Copy Text
            </Button>
            <SaveGenerationButton
              contentJson={contentJson}
              contentText={contentText || ""}
              imageFile={imageFile || currentFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
