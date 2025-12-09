import React, { useEffect } from "react";
import IframeResizer from "@iframe-resizer/react";
import ReactDOM from "react-dom/client";

import "~/globals.css"; // Import global styles

import { FAQs } from "./components/faqs";
import { Features } from "./components/features";
// Landing page components
import { Hero } from "./components/hero";
import { HowToUse } from "./components/how-to-use";
import { MainFeatures } from "./components/main-features";
import { Reason } from "./components/reason";

/**
 * Embedded iframe component - existing tool
 */
function EmbedLinkedInPreviewTool() {
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
        sandbox="allow-scripts allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox"
        allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; clipboard-read; clipboard-write; display-capture; document-domain; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; publickey-credentials-create; publickey-credentials-get; speaker-selection; usb; web-share; xr-spatial-tracking"
        title="LinkedIn Preview Tool"
      />
    </div>
  );
}

/**
 * Main LinkedIn Preview Tool Landing Page
 * Includes full landing page with all marketing sections + embedded tool
 */
function LinkedInPreviewLanding() {
  useEffect(() => {
    // Inject additional SEO structured data
    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "LinkedIn Preview Tool",
      url: "https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview",
      description:
        "Free LinkedIn post preview tool. See how your posts will look before publishing.",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Organization",
        name: "EngageKit",
        url: "https://engagekit.io",
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tools",
          item: "https://engagekit-ghost-blog.vercel.app/tools",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "LinkedIn Preview Tool",
          item: "https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview",
        },
      ],
    };

    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.text = JSON.stringify(webAppSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return (
    <div className="ek-component-container w-full">
      <Hero />
      <EmbedLinkedInPreviewTool />
      <MainFeatures />
      <HowToUse />
      <Reason />
      <Features />
      <FAQs />
    </div>
  );
}

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
  ReactDOM.createRoot(mountPoint).render(
    React.createElement(LinkedInPreviewLanding),
  );
}

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
