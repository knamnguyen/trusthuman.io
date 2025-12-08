import React from "react";
import ReactDOM from "react-dom/client";

import { LinkedInPreviewTool } from "./linkedin-preview-tool";

import "~/globals.css"; // Import global styles

const embedLinkedInPreview = () => {
  return (
    <div>
      <iframe
        id="myIframe"
        src="https://engagekit.io/tools/linkedinpreview/embed"
        className="h-[100vh] w-full border-none"
        title="LinkedIn Preview Tool"
      ></iframe>
    </div>
  );
};

export function mountLinkedInPreview(rootSelector = "#linkedin-preview-root") {
  let mountPoint = document.querySelector(rootSelector);
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "linkedin-preview-root";
    // Insert at the top of body (before first child, or append if body is empty)
    if (document.body.firstChild) {
      document.body.insertBefore(mountPoint, document.body.firstChild);
    } else {
      document.body.appendChild(mountPoint);
    }
  }
  // Add scoping class to prevent CSS conflicts with host site
  mountPoint.classList.add("ek-component-container");
  //   ReactDOM.createRoot(mountPoint).render(
  //     React.createElement(LinkedInPreviewTool),
  //   );
  ReactDOM.createRoot(mountPoint).render(
    React.createElement(embedLinkedInPreview),
  );
}

// Export component for direct use
export { LinkedInPreviewTool } from "./linkedin-preview-tool";

// Auto-mount when script loads
// Creates mount point automatically if it doesn't exist
async function autoMount() {
  mountLinkedInPreview();

  // Initialize iframe-resizer on the created iframe
  if (typeof window !== "undefined") {
    // Dynamically import iframe-resizer parent and access the global it sets up
    await import("@iframe-resizer/parent");

    // Wait a bit for iframe to be rendered and for iframeResize to be available globally
    setTimeout(() => {
      const iframe = document.querySelector("#myIframe");
      if (iframe && typeof (window as any).iframeResize === "function") {
        (window as any).iframeResize(
          {
            license: "GPLv3",
            log: true,
            checkOrigin: false,
          },
          iframe,
        );
      }
    }, 100);
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
}
