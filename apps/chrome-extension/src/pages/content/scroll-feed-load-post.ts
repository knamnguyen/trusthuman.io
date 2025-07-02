import wait from "@src/utils/wait";

// Helper function to manually trigger scroll events for better LinkedIn compatibility
function triggerScrollEvents() {
  try {
    // Create scroll event (following the 10-year-old solution approach)
    const scrollEvent = new Event("scroll", {
      bubbles: true,
      cancelable: true,
    });

    // Method 1: Traditional window/document events
    window.dispatchEvent(scrollEvent);
    document.dispatchEvent(scrollEvent);

    // Method 2: Target LinkedIn's specific feed containers (key insight from old solution)
    const linkedInFeedSelectors = [
      ".scaffold-layout__main", // Main content area
      ".feed-container-theme", // Feed container
      ".scaffold-finite-scroll", // Infinite scroll container
      ".feed-shared-update-v2", // Individual post containers
      ".application-outlet", // Main app container
      ".feed-outlet", // Feed outlet
      "#main", // Main element
      '[role="main"]', // ARIA main role
      ".ember-application", // Ember app container
    ];

    // Dispatch scroll events to each LinkedIn container we can find
    linkedInFeedSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element) {
          element.dispatchEvent(scrollEvent);
          console.log(`Triggered scroll event on: ${selector}`);
        }
      });
    });

    // Method 3: Also trigger wheel events (some sites listen for these)
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    });
    window.dispatchEvent(wheelEvent);

    // Trigger wheel events on main containers too
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
}

// Function to scroll feed and load posts - Aggressive scrolling to bottom
export default async function scrollFeedLoadPosts(
  duration: number,
  isCommentingActive: boolean,
  statusPanel?: HTMLDivElement,
): Promise<void> {
  console.log(
    `Aggressively scrolling feed for ${duration} seconds to load posts...`,
  );

  const startTime = Date.now();
  const endTime = startTime + duration * 1000;

  // Track metrics for debugging
  let scrollAttempts = 0;
  let postCountBefore = 0;
  let lastPostCount = 0;

  // Get initial post count
  const initialPosts = document.querySelectorAll(
    ".feed-shared-update-v2__control-menu-container",
  );
  postCountBefore = initialPosts.length;
  lastPostCount = postCountBefore;

  // Use aggressive scrolling - just go to bottom repeatedly
  const pauseBetweenScrolls = 2000; // 2 second pause to allow content loading

  while (Date.now() < endTime && isCommentingActive) {
    // Check if we should stop
    if (!isCommentingActive) {
      break;
    }

    const currentTime = Date.now();
    const timeRemaining = Math.round((endTime - currentTime) / 1000);

    // Update status panel if available
    if (statusPanel) {
      const currentPosts = document.querySelectorAll(
        ".feed-shared-update-v2__control-menu-container",
      ).length;
      const newPostsThisSession = currentPosts - postCountBefore;

      const timeRemainingElement = statusPanel.querySelector(
        "#time-remaining span",
      );
      const postsLoadedElement =
        statusPanel.querySelector("#posts-loaded span");
      const scrollProgressElement = statusPanel.querySelector(
        "#scroll-progress span",
      );

      if (timeRemainingElement) {
        timeRemainingElement.textContent = `${timeRemaining}s`;
      }

      if (postsLoadedElement) {
        postsLoadedElement.textContent = `${currentPosts} posts (+${newPostsThisSession} this session)`;
      }

      if (scrollProgressElement) {
        scrollProgressElement.textContent = `Scroll attempt ${
          scrollAttempts + 1
        } - Loading content...`;
      }
    }

    scrollAttempts++;

    // Record current scroll position
    const beforeScroll = window.scrollY;
    const documentHeight = document.body.scrollHeight;

    // Aggressive scroll: Go straight to bottom
    window.scrollTo({ top: documentHeight, behavior: "smooth" });

    // Trigger scroll events on LinkedIn's specific containers
    triggerScrollEvents();

    // Wait for scroll to complete and content to load
    await wait(pauseBetweenScrolls);

    const afterScroll = window.scrollY;
    const newDocumentHeight = document.body.scrollHeight;

    // Check for new content after each scroll
    const currentPosts = document.querySelectorAll(
      ".feed-shared-update-v2__control-menu-container",
    );
    const newPostCount = currentPosts.length;

    if (newPostCount > lastPostCount) {
      const newPosts = newPostCount - lastPostCount;
      lastPostCount = newPostCount;

      // Update status panel with success indicator
      if (statusPanel) {
        const scrollProgressElement = statusPanel.querySelector(
          "#scroll-progress span",
        );
        if (scrollProgressElement) {
          scrollProgressElement.textContent = `✅ Loaded ${newPosts} new posts! (Total: ${newPostCount})`;
        }
      }
    } else {
      // Update status panel with no new content indicator
      if (statusPanel) {
        const scrollProgressElement = statusPanel.querySelector(
          "#scroll-progress span",
        );
        if (scrollProgressElement) {
          scrollProgressElement.textContent = `⏳ Waiting for new content... (${newPostCount} posts)`;
        }
      }
    }
  }

  // Final status update
  if (statusPanel) {
    const finalPosts = document.querySelectorAll(
      ".feed-shared-update-v2__control-menu-container",
    );
    const totalNewPosts = finalPosts.length - postCountBefore;

    const timeRemainingElement = statusPanel.querySelector(
      "#time-remaining span",
    );
    const scrollProgressElement = statusPanel.querySelector(
      "#scroll-progress span",
    );

    if (timeRemainingElement) {
      timeRemainingElement.textContent = `0s - COMPLETE!`;
    }

    if (scrollProgressElement) {
      scrollProgressElement.textContent = `🎉 Scrolling complete! Loaded ${totalNewPosts} new posts`;
    }
  }

  // Final metrics
  const finalPosts = document.querySelectorAll(
    ".feed-shared-update-v2__control-menu-container",
  );
  const totalNewPosts = finalPosts.length - initialPosts.length;
  const actualDuration = Math.round((Date.now() - startTime) / 1000);

  console.log("Finished aggressive scrolling to load posts");
}
