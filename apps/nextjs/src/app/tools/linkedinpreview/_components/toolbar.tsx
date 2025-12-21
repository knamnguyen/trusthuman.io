"use client";

import type { Editor } from "@tiptap/react";
import React from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";

import { Button } from "@sassy/ui/button";
import { Separator } from "@sassy/ui/separator";

type Props = {
  editor: Editor | null;
};

export const Toolbar: React.FC<Props> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-none flex-wrap items-center justify-start gap-1 overflow-x-auto sm:gap-2">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive("bold") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <Bold className="size-4 sm:size-5" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive("italic") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <Italic className="size-4 sm:size-5" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        variant={editor.isActive("strike") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <Strikethrough className="size-4 sm:size-5" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        variant={editor.isActive("underline") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <Underline className="size-4 sm:size-5" />
      </Button>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editor.isActive("bulletList") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <List className="size-4 sm:size-5" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant={editor.isActive("orderedList") ? "secondary" : "outline"}
        size="icon"
        className="shrink-0"
      >
        <ListOrdered className="size-4 sm:size-5" />
      </Button>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        variant="outline"
        size="icon"
        className="shrink-0"
      >
        <Undo className="size-4 sm:size-5" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        variant="outline"
        size="icon"
        className="shrink-0"
      >
        <Redo className="size-4 sm:size-5" />
      </Button>
    </div>
  );
};
