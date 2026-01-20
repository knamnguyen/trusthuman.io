import type { TourFlow } from "@sassy/ui/components/tour";

import { TutorialTooltipAnchorEl } from "./../../../../ultimate-activation-kit/tutorial";

/**
 * Helper to click an element - searches shadow root first, then document
 */
function clickElement(
  selector: string,
  shadowRoot?: Element | DocumentFragment | null,
) {
  const element =
    shadowRoot?.querySelector(selector) ?? document.querySelector(selector);
  if (element instanceof HTMLElement) {
    element.click();
    console.log("Clicked element:", selector);
  }
}

/**
 * Extension Introduction Tour
 *
 * A simple 4-step tour that introduces users to each tab of the sidebar.
 * Each step gives a high-level overview of what that tab does.
 */
export const extensionIntroFlow: TourFlow = {
  id: "extension-intro",
  name: "Extension Introduction",
  defaultModalPosition: "center-center",
  onBeforeTour: async ({ shadowRoot }) => {
    // Check if sidebar is already open by looking for sheet content with open state
    const sidebarContent =
      shadowRoot?.querySelector(
        "[data-slot='sheet-content'][data-state='open']",
      ) ??
      document.querySelector("[data-slot='sheet-content'][data-state='open']");

    if (!sidebarContent) {
      // Sidebar is closed, click the toggle button to open it
      clickElement("#ek-sidebar-toggle-button", shadowRoot);
      // Wait for sidebar animation to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  },
  steps: [
    {
      id: "compose-tab",
      selector: ["#ek-compose-tab-button", "#ek-compose-tab"],
      title: "Engage 10x faster with Compose mode",
      subtitle:
        "Load posts from your feed/target lists in compose mode. Quickly navigate each post to engage. Write 100% human comments or with AI Assist. All submitted comments saved to history. Try clicking the load post button below",
      previewVideo: "https://youtu.be/2Ee0FnkDNnY",
      tutorialVideo: "https://youtu.be/J94jMmPrb5A",
      preferredView: "modal",
      onBeforeStep: ({ shadowRoot }) => {
        clickElement("#ek-compose-tab-button", shadowRoot);
      },
      simulateSelectors: ["#ek-load-posts-button"],
      simulateSelectorsAnimated: true,
    },
    {
      id: "connect-tab",
      selector: [
        "#ek-connect-tab-button",
        "#ek-connect-tab",
        ".ek-save-profile-button",
      ],
      title: "See engagement rate & Organize Lists ",
      subtitle:
        "View anyone's engagement rate, history, and network. Save them to your target lists or custom and in time engagement. Try clicking the save profile icon below",
      previewVideo: "https://youtu.be/llZWpYXt4_8",
      tutorialVideo: "https://youtu.be/-xVRXejvmMY",
      preferredView: "modal",
      onBeforeStep: ({ shadowRoot }) => {
        clickElement("#ek-connect-tab-button", shadowRoot);
      },
      simulateSelectors: [".ek-save-profile-button"],
      simulateSelectorsAnimated: true,
    },
    {
      id: "analytics-tab",
      selector: ["#ek-analytics-tab-button", "#ek-analytics-tab"],
      title: "View Your Stats",
      subtitle:
        "All of the most important LinkedIn stats in one place. Watch your engagement brings real results in real time. Try clicking the change/total toggle below",
      previewVideo: "https://youtu.be/mnEa0UulI-c",
      tutorialVideo: "https://youtu.be/k1_8MJaBYHk",
      preferredView: "modal",
      onBeforeStep: ({ shadowRoot }) => {
        clickElement("#ek-analytics-tab-button", shadowRoot);
      },
      simulateSelectors: ["#ek-chart-view-mode"],
      simulateSelectorsAnimated: true,
    },
    {
      id: "account-tab",
      selector: ["#ek-account-tab-button", "#ek-account-tab"],
      title: "Manage Your Accounts",
      subtitle:
        "Add, switch, or remove LinkedIn accounts connected to the extension. View and manage your comemnt history, personas, and target list from the webapp. Try clicking the dashboard, refresh or manage account button below.",
      previewVideo: "https://youtu.be/UJ8Z-qSHns4",
      tutorialVideo: "https://youtu.be/J94jMmPrb5A",
      preferredView: "modal",
      onBeforeStep: ({ shadowRoot }) => {
        clickElement("#ek-account-tab-button", shadowRoot);
      },
      simulateSelectors: [
        "#ek-account-dashboard-button",
        "#manage-account-button",
        "#refresh-account-button",
      ],
      simulateSelectorsAnimated: true,
    },
  ],
};

/** All available tour flows */
export const tourFlows: TourFlow[] = [extensionIntroFlow];
