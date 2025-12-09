"use client";

import type { DropdownItem } from "./nav-dropdown-container";
import { NavDropdownContainer } from "./nav-dropdown-container";

export const BLOG_LABEL = "Blog";

// Re-export DropdownItem for convenience
export type { DropdownItem };

// Default mock blog items (used when no items are provided)
const defaultBlogItems: DropdownItem[] = [
  {
    id: "blog-1",
    title: "Blog Post 1",
    href: "#",
    iconEmoji: "📄",
    description: "Latest blog post about LinkedIn growth",
    previewImage: "https://via.placeholder.com/600x400?text=Blog+Post+1",
  },
  {
    id: "blog-2",
    title: "Blog Post 2",
    href: "#",
    iconEmoji: "📄",
    description: "Tips for building your personal brand",
    previewImage: "https://via.placeholder.com/600x400?text=Blog+Post+2",
  },
  {
    id: "blog-3",
    title: "Blog Post 3",
    href: "#",
    iconEmoji: "📄",
    description: "How to engage effectively on LinkedIn",
    previewImage: "https://via.placeholder.com/600x400?text=Blog+Post+3",
  },
];

interface BlogDropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  isLoading?: boolean;
}

// Blog dropdown component - accepts optional items prop for real data
export function BlogDropdown({
  trigger,
  items,
  isLoading,
}: BlogDropdownProps) {
  // Show loading state if data is being fetched
  if (isLoading) {
    return <div className="relative">{trigger}</div>;
  }

  // Use provided items or fall back to default mock items
  const blogItems = items && items.length > 0 ? items : defaultBlogItems;

  return <NavDropdownContainer trigger={trigger} items={blogItems} />;
}
