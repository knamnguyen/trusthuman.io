import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { FooterComponent } from "@sassy/ui/components/footer-component";
import { NavComponent } from "@sassy/ui/components/nav-component";
import { TableContentComponent } from "@sassy/ui/components/table-content-component";

import { useBlogPosts } from "~/hooks/use-blog-posts";
// Import LinkedIn Preview Tool for dev preview
import { mountLinkedInPreview } from "~/tools/linkedinpreview";

import "~/globals.css";

function App() {
  const { blogItems, isLoading: blogItemsLoading } = useBlogPosts();

  useEffect(() => {
    mountLinkedInPreview();
  }, []);

  // Uncomment below to preview the LinkedIn Preview Tool landing page
  // return <div id="linkedin-preview-root" />;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <NavComponent blogItems={blogItems} blogItemsLoading={blogItemsLoading} />
      <main className="container mx-auto mt-20 flex-1 px-4 py-8">
        {/* Mock article for TableContentComponent preview */}
        <article className="gh-article mx-auto mt-16 max-w-2xl">
          <h1 className="gh-article-title mb-8 text-3xl font-bold">
            Sample Article for TOC Preview
          </h1>
          <div className="prose">
            <h2>Introduction</h2>
            <p>
              This is a sample article to demonstrate the Table of Contents
              component.
            </p>

            <h2>Getting Started</h2>
            <p>
              The TOC will appear on the right side of the article on desktop
              screens.
            </p>

            <h2>Features</h2>
            <p>
              Click on any heading in the TOC to smooth scroll to that section.
            </p>

            <h2>Sharing</h2>
            <p>Use the share buttons below the TOC to share the article.</p>

            <h2>Conclusion</h2>
            <p>That's all for this demo!</p>
          </div>
        </article>
        <TableContentComponent />
      </main>
      <FooterComponent />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
