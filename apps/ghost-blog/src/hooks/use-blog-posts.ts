"use client";

import { useEffect, useState } from "react";

import type { DropdownItem } from "@sassy/ui/components/nav-component";

import { fetchGhostPosts, type GhostPost } from "~/lib/ghost-client";

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
    iconEmoji: "📄",
    description: post.excerpt || extractTextFromHtml(post.html, 15),
    previewImage: post.feature_image,
  };
}

// Hook to fetch blog posts from Ghost CMS
export function useBlogPosts() {
  const [blogItems, setBlogItems] = useState<DropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        // Filter for posts with "blog" tag only
        const posts = await fetchGhostPosts(20, "blog");
        const items = posts.map(ghostPostToDropdownItem);
        setBlogItems(items);
      } catch (error) {
        console.error("Failed to load blog posts:", error);
        setBlogItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadPosts();
  }, []);

  return { blogItems, isLoading };
}
