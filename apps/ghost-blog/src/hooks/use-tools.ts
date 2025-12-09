"use client";

import { useEffect, useState } from "react";

import type { DropdownItem } from "@sassy/ui/components/nav-blog";

import { generateEmojiFromText } from "~/lib/emoji-utils";
import type { GhostPost } from "~/lib/ghost-client";
import { fetchGhostPosts } from "~/lib/ghost-client";

// Helper to extract text from HTML and truncate
function extractTextFromHtml(
  html: string | undefined,
  maxWords: number = 15,
): string {
  if (!html) return "";
  // Remove HTML tags
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

// Convert Ghost post to DropdownItem
function ghostPostToDropdownItem(post: GhostPost): DropdownItem {
  return {
    id: post.id,
    title: post.title,
    href: post.url || `https://engagekit.ghost.io/${post.slug}/`,
    iconEmoji: generateEmojiFromText(post.title),
    description: post.excerpt || extractTextFromHtml(post.html, 15),
    previewImage: post.feature_image,
  };
}

// Hook to fetch tools from Ghost CMS
export function useTools() {
  const [toolItems, setToolItems] = useState<DropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTools() {
      setIsLoading(true);
      try {
        // Filter for posts with "tool" tag only
        const posts = await fetchGhostPosts(20, "tool");
        const items = posts.map(ghostPostToDropdownItem);
        setToolItems(items);
      } catch (error) {
        console.error("Failed to load tools:", error);
        setToolItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTools();
  }, []);

  return { toolItems, isLoading };
}
