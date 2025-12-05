import React from "react";
import ReactDOM from "react-dom/client";

import { FooterComponent } from "@sassy/ui/components/footer-component";

import "~/globals.css";

export function mountFooter(rootSelector = "#footer-component-root") {
  let mountPoint = document.querySelector(rootSelector);
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "footer-component-root";
    document.body.appendChild(mountPoint);
  }
  // Add scoping class to prevent CSS conflicts with host site
  mountPoint.classList.add("ek-component-container");
  ReactDOM.createRoot(mountPoint).render(React.createElement(FooterComponent));
}
