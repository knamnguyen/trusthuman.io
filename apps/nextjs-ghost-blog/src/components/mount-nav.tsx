import React from "react";
import ReactDOM from "react-dom/client";

import { NavComponent } from "@sassy/ui/components/nav-component";

import "~/app/globals.css";

import { useBlogPosts } from "~/hooks/use-blog-posts";

// Wrapper component that fetches Ghost blog data
function NavWithData() {
  const { blogItems, isLoading } = useBlogPosts();
  return <NavComponent blogItems={blogItems} blogItemsLoading={isLoading} />;
}

export function mountNav(rootSelector = "#nav-component-root") {
  let mountPoint = document.querySelector(rootSelector);
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "nav-component-root";
    document.body.prepend(mountPoint);
  }
  // Add scoping class to prevent CSS conflicts with host site
  mountPoint.classList.add("ek-component-container");
  ReactDOM.createRoot(mountPoint).render(React.createElement(NavWithData));
}
