import ReactDOM from "react-dom/client";

import { TableContentComponent } from "@sassy/ui/components/table-content-component";

export function mountTableContent(rootSelector = "#table-content-root") {
  let mountPoint = document.querySelector(rootSelector);
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "table-content-root";
    document.body.appendChild(mountPoint);
  }
  // Add scoping class to prevent CSS conflicts with host site
  mountPoint.classList.add("ek-component-container");
  ReactDOM.createRoot(mountPoint).render(<TableContentComponent />);
}
