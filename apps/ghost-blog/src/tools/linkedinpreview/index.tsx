import React from "react";
import IframeResizer from "@iframe-resizer/react";
import ReactDOM from "react-dom/client";

import { LinkedInPreviewTool } from "./linkedin-preview-tool";

import "~/globals.css"; // Import global styles

const embedLinkedInPreview = () => {
  return (
    <div>
      <IframeResizer
        id="myIframe"
        src="https://engagekit.io/tools/linkedinpreview/embed"
        className="w-full border-none"
        style={{ width: "100%", height: "100vh" }}
        license="GPLv3"
        log="collapsed"
        checkOrigin={false}
        allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; clipboard-read; clipboard-write; display-capture; document-domain; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; publickey-credentials-create; publickey-credentials-get; speaker-selection; usb; web-share; xr-spatial-tracking"
        title="LinkedIn Preview Tool"
      />
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
function autoMount() {
  mountLinkedInPreview();
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
}
