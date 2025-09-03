import type { ApproveContext } from "./types";

const PANEL_ID = "engagekit-approve-panel";

export const findSidebarContainer = (): HTMLElement | null => {
  // New default target
  const defaultSidebar = document.querySelector(
    "aside.scaffold-layout__sidebar",
  ) as HTMLElement | null;
  if (defaultSidebar) return defaultSidebar;

  const primary = document.querySelector(
    '[aria-label="Side Bar"]',
  ) as HTMLElement | null;
  if (primary) return primary;
  const fallback = document.querySelector(
    'aside.scaffold-layout__aside[aria-label="Search suggestions"]',
  ) as HTMLElement | null;
  if (fallback) return fallback;
  return null;
};

export function injectApprovePanel(): ApproveContext {
  // Cleanup any existing panel first
  const prev = document.getElementById(PANEL_ID);
  if (prev) prev.remove();

  let host = findSidebarContainer();
  const panel = document.createElement("div");
  panel.id = PANEL_ID;

  const isFloating = !host;
  if (!host) {
    host = document.body;
  }

  // Basic panel styles (rectangle container)
  Object.assign(panel.style, {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    zIndex: "2147483647",
  } as CSSStyleDeclaration);

  if (isFloating) {
    Object.assign(panel.style, {
      position: "fixed",
      right: "12px",
      top: "80px",
      width: "360px",
      maxHeight: "70vh",
      overflow: "auto",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      background: "#fefefe",
    } as CSSStyleDeclaration);
  } else {
    // Remove explicit sticky/top; rely on LinkedIn classes below
    Object.assign(panel.style, {
      maxHeight: "70vh",
      overflow: "auto",
    } as CSSStyleDeclaration);
  }

  // Header
  const header = document.createElement("div");
  header.textContent = "EngageKit – Manual Approve";
  Object.assign(header.style, {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  } as CSSStyleDeclaration);
  panel.appendChild(header);

  // List container
  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  } as CSSStyleDeclaration);
  panel.appendChild(list);

  // Add LinkedIn sticky classes for native behavior
  panel.classList.add(
    "scaffold-layout__sticky",
    "scaffold-layout__sticky--is-active",
    "scaffold-layout__sticky--md",
  );

  // Mount
  if (isFloating) {
    host!.appendChild(panel);
  } else {
    host!.insertBefore(panel, host!.firstChild);
  }

  return {
    panel,
    list,
    mapByUrn: new Map(),
    isUpdatingFromRow: false,
    isUpdatingFromEditor: false,
    defaultText: "Great post, thanks for sharing",
  };
}

export function removeApprovePanel(): void {
  const el = document.getElementById(PANEL_ID);
  if (el) el.remove();
}
