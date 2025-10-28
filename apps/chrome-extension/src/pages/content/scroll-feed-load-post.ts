import wait from "@src/utils/wait";

import {
  clickLoadMore,
  countPosts,
  SCROLL_PAUSE_MS,
  triggerScrollEvents,
} from "./utils/scroll-helpers";

// Function to scroll feed and load posts - Aggressive scrolling to bottom
export default async function scrollFeedLoadPosts(
  duration: number,
  isCommentingActive: boolean,
  statusPanel?: HTMLDivElement | null,
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

  // Additional console logging: initial/per-cycle/final summary
  const initial = countPosts();
  let last = initial;
  let cycles = 0;
  let clicks = 0;
  console.log(`Initial posts: ${initial}`);

  // Use aggressive scrolling - just go to bottom repeatedly
  const pauseBetweenScrolls = SCROLL_PAUSE_MS;

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

    // Try native load-more button as well
    cycles++;
    if (await clickLoadMore()) clicks++;

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

    // Console logging for quick verification
    try {
      const total = countPosts();
      const delta = total - last;
      last = total;
      console.log(`+${delta} -> total ${total}`);
    } catch {}
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

  // Final console summary
  try {
    const finalTotal = countPosts();
    const added = finalTotal - initial;
    console.log(
      `Final posts: ${finalTotal} (added ${added} over ${cycles} cycles, load-more clicks: ${clicks})`,
    );
  } catch {}
}
