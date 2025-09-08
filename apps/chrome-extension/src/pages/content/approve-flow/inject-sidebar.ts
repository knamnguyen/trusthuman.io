import type { ApproveContext } from "./types";

const PANEL_ID = "engagekit-approve-panel";

// Deprecated: LinkedIn host detection removed. We always mount to body as an overlay.

export function injectApprovePanel(): ApproveContext {
  // Cleanup any existing panel first
  const prev = document.getElementById(PANEL_ID);
  if (prev) prev.remove();
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  // Fixed overlay styles (right docked)
  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    right: "0",
    height: "100vh",
    width: "400px",
    overflowY: "auto",
    background: "#fff",
    borderLeft: "1px solid #e5e7eb",
    boxShadow: "-8px 0 20px rgba(0,0,0,0.08)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    zIndex: "2147483647",
  } as CSSStyleDeclaration);

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

  // Mount overlay to body
  document.body.appendChild(panel);

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
