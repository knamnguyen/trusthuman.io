export const SCROLL_PAUSE_MS = 1500 as const;

export const triggerScrollEvents = (): void => {
  try {
    const scrollEvent = new Event("scroll", {
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(scrollEvent);
    document.dispatchEvent(scrollEvent);

    const linkedInFeedSelectors = [
      ".scaffold-layout__main",
      ".feed-container-theme",
      ".scaffold-finite-scroll",
      ".feed-shared-update-v2",
      ".application-outlet",
      ".feed-outlet",
      "#main",
      '[role="main"]',
      ".ember-application",
    ];

    linkedInFeedSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element) {
          element.dispatchEvent(scrollEvent);
          console.log(`Triggered scroll event on: ${selector}`);
        }
      });
    });

    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 200,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    });
    window.dispatchEvent(wheelEvent);

    const mainContainer = document.querySelector(
      ".scaffold-layout__main, .feed-container-theme",
    );
    if (mainContainer) {
      mainContainer.dispatchEvent(wheelEvent);
      console.log("Triggered wheel event on main LinkedIn container");
    }
  } catch (error) {
    console.error("Failed to trigger scroll events:", error);
  }
};

export const countPosts = (): number => {
  try {
    const byDataId = document.querySelectorAll("div[data-id]").length;
    const byDataUrn = document.querySelectorAll("div[data-urn]").length;
    const byMenu = document.querySelectorAll(
      ".feed-shared-update-v2__control-menu-container",
    ).length;
    return Math.max(byDataId, byDataUrn, byMenu);
  } catch {
    return 0;
  }
};

export const clickLoadMore = async (): Promise<boolean> => {
  try {
    const btn = document.querySelector(
      ".scaffold-finite-scroll__load-button",
    ) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      console.log("clicked load more post buttons");
      return true;
    }
  } catch {}
  return false;
};
