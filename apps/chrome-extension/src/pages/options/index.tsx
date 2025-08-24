import React from "react";
import { createRoot } from "react-dom/client";

import Options from "./Options";

function init() {
  const appContainer = document.querySelector("#__next");
  if (!appContainer) {
    throw new Error("Cannot find __next root element");
  }
  const root = createRoot(appContainer);
  root.render(<Options />);
}

init();
