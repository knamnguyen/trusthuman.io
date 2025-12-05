"use client";

import { useEffect, useRef, useState } from "react";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Copy } from "lucide-react";
import { siFacebook, siX } from "simple-icons";

import { cn } from "../utils";

// Wrapper component for the applause-button custom element
function ApplauseButton({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && !ref.current.querySelector("applause-button")) {
      const button = document.createElement("applause-button");
      button.setAttribute("url", url);
      button.setAttribute("color", "#e5486c");
      button.setAttribute("multiclap", "true");
      button.style.width = "58px";
      button.style.height = "58px";
      ref.current.appendChild(button);
    }
  }, [url]);

  return <div ref={ref} className="flex justify-center" />;
}

interface HeadingItem {
  id: string;
  text: string;
  element: HTMLElement;
}

// Helper function to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single
}

export function TableContentComponent() {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [titleTop, setTitleTop] = useState(0);
  const [titleLeft, setTitleLeft] = useState(0);
  const [titleWidth, setTitleWidth] = useState(0);
  const [articleBottom, setArticleBottom] = useState(0);
  const [bottomAlignedTop, setBottomAlignedTop] = useState(0);
  const [articleFound, setArticleFound] = useState(false);
  const [titleFound, setTitleFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLElement | null>(null);

  // Scan for article element and extract headings
  useEffect(() => {
    const article = document.querySelector(".gh-article") as HTMLElement | null;

    if (!article) {
      setArticleFound(false);
      return;
    }

    articleRef.current = article;
    setArticleFound(true);

    // Query all h2 elements within the article
    const h2Elements = article.querySelectorAll("h2");

    if (h2Elements.length === 0) {
      setHeadings([]);
      return;
    }

    // Process each h2 element
    const processedHeadings: HeadingItem[] = Array.from(h2Elements).map(
      (h2) => {
        const text = h2.textContent || "";
        const id = generateSlug(text);
        return {
          id,
          text,
          element: h2 as HTMLElement,
        };
      },
    );

    setHeadings(processedHeadings);
  }, []);

  // Scan for article title element for positioning
  useEffect(() => {
    const title = document.querySelector(
      ".gh-article-title",
    ) as HTMLElement | null;

    if (!title) {
      setTitleFound(false);
      return;
    }

    titleRef.current = title;
    setTitleFound(true);
  }, []);

  // Calculate nav bar height
  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.querySelector("nav");
      if (nav) {
        const rect = nav.getBoundingClientRect();
        setNavHeight(rect.height);
      }
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("scroll", updateNavHeight);

    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("scroll", updateNavHeight);
    };
  }, []);

  // Calculate initial title position and article bottom, update on scroll/resize
  useEffect(() => {
    if (!titleRef.current || !articleRef.current) return;

    const updatePositions = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        setTitleTop(titleRect.top + window.scrollY);
        setTitleLeft(titleRect.left + window.scrollX);
        setTitleWidth(titleRect.width);
      }
      if (articleRef.current) {
        const articleRect = articleRef.current.getBoundingClientRect();
        setArticleBottom(articleRect.bottom + window.scrollY);
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions);
    };
  }, [titleFound, articleFound]);

  // Handle sticky behavior on scroll
  useEffect(() => {
    if (!titleRef.current || !articleRef.current || !containerRef.current)
      return;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Update positions
      let currentTitleTop = titleTop;
      let currentArticleBottom = articleBottom;

      if (titleRef.current) {
        const rect = titleRef.current.getBoundingClientRect();
        const newTitleTop = rect.top + window.scrollY;
        setTitleLeft(rect.left + window.scrollX);
        setTitleWidth(rect.width);
        setTitleTop(newTitleTop);
        currentTitleTop = newTitleTop;
      }
      if (articleRef.current) {
        const rect = articleRef.current.getBoundingClientRect();
        const newArticleBottom = rect.bottom + window.scrollY;
        setArticleBottom(newArticleBottom);
        currentArticleBottom = newArticleBottom;
      }

      // Get current widget height
      const widgetHeight = containerRef.current?.offsetHeight || 0;

      // Get article bottom in viewport coordinates (for fixed positioning)
      const articleBottomViewport =
        articleRef.current?.getBoundingClientRect().bottom || 0;

      // Check if we've scrolled past article bottom
      // When at bottom, widget bottom should align with article bottom
      // Calculate what the widget bottom would be if sticky
      const stickyWidgetBottom = scrollY + navHeight + widgetHeight;

      if (stickyWidgetBottom >= currentArticleBottom && widgetHeight > 0) {
        // Stop sticky, align bottom of widget with bottom of article
        setIsSticky(false);
        setIsAtBottom(true);
        // Calculate and store the top position for bottom alignment
        // Use viewport-relative position since we're using fixed positioning
        const calculatedTop = articleBottomViewport - widgetHeight;
        setBottomAlignedTop(calculatedTop);
      } else {
        setIsAtBottom(false);
        // Check if we should be sticky (scrolled past title top)
        const shouldBeSticky = scrollY + navHeight >= currentTitleTop;
        setIsSticky(shouldBeSticky);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [titleTop, navHeight, articleBottom]);

  // Click handler for smooth scroll
  const handleHeadingClick = (element: HTMLElement) => {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Get current page URL and title
  const getCurrentUrl = () => window.location.href;
  const getCurrentTitle = () => {
    const titleElement = document.querySelector(".gh-article-title");
    return titleElement?.textContent || document.title;
  };

  // Share handlers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentUrl());
      // Optional: Show a toast or feedback
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareX = () => {
    const url = encodeURIComponent(getCurrentUrl());
    const title = encodeURIComponent(getCurrentTitle());
    const shareUrl = `https://x.com/intent/tweet?text=${title}%20${url}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getCurrentUrl());
    const shareUrl = `https://www.facebook.com/share_channel/?type=reshare&link=${url}&app_id=542599432471018&source_surface=external_reshare&display=page`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(getCurrentUrl());
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite?mini=true&url=${url}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  // Early return if article not found, title not found, or no headings
  if (!articleFound || !titleFound || headings.length === 0) {
    return null;
  }

  // Calculate positioning based on title element
  const widgetWidth = 220; // Widget width
  const gap = 60; // Gap between widget and title
  let leftPosition = titleLeft + titleWidth + gap; // Position to the right of the title

  // Ensure widget doesn't go off the right edge of the viewport
  if (typeof window !== "undefined") {
    const viewportWidth = window.innerWidth;
    const maxLeft = viewportWidth - widgetWidth - 10; // 10px right margin
    if (leftPosition > maxLeft) {
      leftPosition = maxLeft;
    }
  }

  // Calculate top position
  let topPosition: number;
  if (isAtBottom) {
    // Use the calculated top position for bottom alignment
    topPosition = bottomAlignedTop;
  } else if (isSticky) {
    topPosition = navHeight + 25;
  } else {
    topPosition = titleTop;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        isSticky || isAtBottom ? "fixed" : "absolute",
        "z-40",
        "hidden md:block", // Hide on mobile, show on medium screens and up
      )}
      style={{
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        width: `${widgetWidth}px`,
      }}
    >
      {/* Applause button - floating above table content, centered */}
      <div className="pb-4">
        <ApplauseButton url={getCurrentUrl()} />
      </div>

      {/* Table of Contents - scrollable area */}
      <div
        className="rounded-sm border-[1.5px] border-black bg-white p-4 shadow-[2px_2px_0_#000]"
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <h3 className="mb-3 text-sm font-bold text-black">Table of Contents</h3>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading.element)}
                className={cn(
                  "w-full text-left text-sm text-black",
                  "hover:text-primary transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
                  "hover:bg-muted rounded-sm px-2 py-1",
                )}
              >
                {`${index + 1}. ${heading.text}`}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Share section - floating below table content, no card */}
      <div className="flex flex-col items-center pt-4">
        <p className="mb-4 text-xs font-semibold text-black">Share to</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              "h-8 w-8 rounded-full border-[1.5px] border-black",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
            )}
            aria-label="Copy link"
          >
            <Copy className="h-4 w-4 text-black" />
          </button>
          <button
            type="button"
            onClick={handleShareX}
            className={cn(
              "h-8 w-8 rounded-full border-[1.5px] border-black",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
            )}
            aria-label="Share on X"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>{siX.title}</title>
              <path d={siX.path} />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShareFacebook}
            className={cn(
              "h-8 w-8 rounded-full border-[1.5px] border-black",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
            )}
            aria-label="Share on Facebook"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>{siFacebook.title}</title>
              <path d={siFacebook.path} />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className={cn(
              "h-8 w-8 rounded-full border-[1.5px] border-black",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
            )}
            aria-label="Share on LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-4 w-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
