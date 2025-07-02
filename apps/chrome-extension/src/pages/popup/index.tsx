import React from "react";
import { createRoot } from "react-dom/client";

import "@pages/popup/index.css";
import "@assets/styles/tailwind.css";

import Popup from "@pages/popup/Popup";
import { ClerkProvider } from "@src/components/clerk-provider";

import { TRPCReactProvider } from "../../trpc/react";

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);
  root.render(
    <ClerkProvider>
      <TRPCReactProvider>
        <Popup />
      </TRPCReactProvider>
    </ClerkProvider>,
  );
}

init();
