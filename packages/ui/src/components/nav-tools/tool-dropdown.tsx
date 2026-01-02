"use client";

import type { DropdownItem } from "./nav-dropdown-container";
import { NavDropdownContainer } from "./nav-dropdown-container";

export const TOOLS_LABEL = "Free Tools";

// Re-export DropdownItem for convenience
export type { DropdownItem };

// Default mock tool items (used when no items are provided)
const defaultToolItems: DropdownItem[] = [
  {
    id: "tool-1",
    title: "Tool 1",
    href: "#",
    iconEmoji: "🔧",
    description: "Description for tool 1",
    previewImage: "https://via.placeholder.com/600x400?text=Tool+1",
  },
  {
    id: "tool-2",
    title: "Tool 2",
    href: "#",
    iconEmoji: "✨",
    description: "Description for tool 2",
    previewImage: "https://via.placeholder.com/600x400?text=Tool+2",
  },
  {
    id: "tool-3",
    title: "Tool 3",
    href: "#",
    iconEmoji: "⚡",
    description: "Description for tool 3",
    previewImage: "https://via.placeholder.com/600x400?text=Tool+3",
  },
];

interface ToolDropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  isLoading?: boolean;
}

// Tool dropdown component - accepts optional items prop for real data
export function ToolDropdown({ trigger, items, isLoading }: ToolDropdownProps) {
  // Show loading state if data is being fetched
  if (isLoading) {
    return <div className="relative">{trigger}</div>;
  }

  // Use provided items or fall back to default mock items
  const toolItems = items && items.length > 0 ? items : defaultToolItems;

  return <NavDropdownContainer trigger={trigger} items={toolItems} />;
}
