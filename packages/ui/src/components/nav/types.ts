import type React from "react";

export interface DropdownItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconEmoji?: string;
  href: string;
  description: string;
  previewImage?: string;
}

export interface NavBarProps {
  /** Logo element to display on the left */
  logo: React.ReactNode;
  /** CTA button/element to display on the right */
  cta?: React.ReactNode;
  /** Dropdown menu items - rendered between logo and CTA */
  children?: React.ReactNode;
  /** Custom className for the nav element */
  className?: string;
}

export interface NavDropdownProps {
  /** The label for the dropdown trigger */
  label: string;
  /** Items to display in the dropdown */
  items: DropdownItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Custom preview renderer - uses default preview if not provided */
  renderPreview?: (item: DropdownItem | null) => React.ReactNode;
  /** Completely custom dropdown content (overrides items) */
  children?: React.ReactNode;
}

export interface NavMobileMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Menu items to display */
  items: Array<{
    label: string;
    href: string;
  }>;
  /** CTA element at the bottom of the menu */
  cta?: React.ReactNode;
}

export interface NavTriggerProps {
  /** Whether the dropdown is currently open */
  isOpen?: boolean;
  /** The label text */
  label: string;
  /** Optional className */
  className?: string;
}
