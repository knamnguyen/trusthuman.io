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
    <div id="linkedinpreviewer-tool">
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
    // Enhanced SoftwareApplication schema (more detailed than WebApplication)
    const softwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EngageKit LinkedIn Post Preview Tool",
      url: "https://blog.engagekit.io/linkedin-post-previewer/",
      description:
        "Professional LinkedIn post formatter with save, share, and preview features. Format posts with bold, italic, emoji, and lists. Preview on mobile, tablet, and desktop before publishing. Save drafts and generate shareable links for team feedback.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "LinkedIn post formatting",
        "Bold text generator",
        "Italic text support",
        "Emoji integration",
        "Bullet point lists",
        "Numbered lists",
        "Mobile preview",
        "Desktop preview",
        "Tablet preview",
        "Save drafts",
        "Shareable preview links",
        "Team collaboration",
        "Unicode character support",
        "Real-time preview",
        "Copy formatted text",
      ],
      author: {
        "@type": "Organization",
        name: "EngageKit",
        url: "https://engagekit.io",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "5421",
      },
    };

    // Organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "EngageKit",
      url: "https://engagekit.io",
      logo: "https://engagekit.io/engagekit-logo.png",
      description:
        "Professional LinkedIn content creation and optimization tools",
      sameAs: [
        "https://x.com/engagekit_io",
        "https://linkedin.com/company/engagekit-io",
      ],
    };

    // BreadcrumbList schema (enhanced)
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://engagekit.io",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://blog.engagekit.io",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Tools",
          item: "https://blog.engagekit.io/tools",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "LinkedIn Preview Tool",
          item: "https://blog.engagekit.io/linkedin-post-previewer/",
        },
      ],
    };

    // HowTo schema (new - for SEO)
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Use LinkedIn Post Preview Tool",
      description:
        "Step-by-step guide to formatting and previewing LinkedIn posts",
      step: [
        {
          "@type": "HowToStep",
          name: "Write or Paste Your LinkedIn Post Content",
          text: "Start with a blank canvas or paste existing copy. Include your hook, main message, and call-to-action.",
        },
        {
          "@type": "HowToStep",
          name: "Apply Professional Text Formatting",
          text: "Use bold, italic, bullet points, numbered lists, and emojis. Watch changes update instantly in the preview pane.",
        },
        {
          "@type": "HowToStep",
          name: "Preview Across Mobile, Tablet & Desktop",
          text: "Switch between device views to see how your post renders. Check where 'see more' truncation happens on mobile.",
        },
        {
          "@type": "HowToStep",
          name: "Create a Free Account to Save & Share",
          text: "Optional: Create free account to save drafts and generate shareable preview links for team feedback.",
        },
        {
          "@type": "HowToStep",
          name: "Share Preview Link with Your Team",
          text: "Send unique preview link to team members for feedback before publishing. No signup required for reviewers.",
        },
        {
          "@type": "HowToStep",
          name: "Save Multiple Versions & A/B Test",
          text: "Save different versions with varying hooks, formatting, or CTAs. Test which gets better engagement.",
        },
        {
          "@type": "HowToStep",
          name: "Copy Formatted Text & Publish to LinkedIn",
          text: "Click 'Copy Formatted Text' and paste into LinkedIn. Formatting is preserved using Unicode characters.",
        },
      ],
    };

    // Inject schemas
    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.text = JSON.stringify(softwareSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script2);

    const script3 = document.createElement("script");
    script3.type = "application/ld+json";
    script3.text = JSON.stringify(organizationSchema);
    document.head.appendChild(script3);

    const script4 = document.createElement("script");
    script4.type = "application/ld+json";
    script4.text = JSON.stringify(howToSchema);
    document.head.appendChild(script4);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
      document.head.removeChild(script3);
      document.head.removeChild(script4);
    };
  }, []);

  return (
    <div className="ek-component-container w-full">
      <main role="main" aria-label="LinkedIn Preview Tool Landing Page">
        <Hero />
        <EmbedLinkedInPreviewTool />
        <MainFeatures />
        <HowToUse />
        <Reason />
        <Features />
        <FAQs />
      </main>
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
