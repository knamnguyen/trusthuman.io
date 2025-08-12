import React from "react";
import { createRoot } from "react-dom/client";

import Options from "./Options";

function init() {
  const appContainer = document.querySelector("#root");
  if (!appContainer) {
    throw new Error("Cannot find root element");
  }
  const root = createRoot(appContainer);
  root.render(<Options />);
}

init();
