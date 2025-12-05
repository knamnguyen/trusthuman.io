import { mountFooter } from "./mount-footer";
import { mountNav } from "./mount-nav";
import { mountTableContent } from "./mount-table-content";

import "~/app/globals.css";

export function initComponents() {
  mountNav();
  mountFooter();
  mountTableContent();
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComponents);
  } else {
    initComponents();
  }
}

declare global {
  interface Window {
    Components?: {
      mountNav: typeof mountNav;
      mountFooter: typeof mountFooter;
      mountTableContent: typeof mountTableContent;
    };
  }
}

if (typeof window !== "undefined") {
  window.Components = { mountNav, mountFooter, mountTableContent };
}
