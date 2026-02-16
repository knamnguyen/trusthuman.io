/**
 * Main entry point for LinkedIn comment history enhancement
 * Provides metrics tracking, sorting, and auto-loading functionality
 */

import { AutoLoadManager } from "./auto-load-manager";
import { updateMetrics } from "./calculate-metrics";
import {
  createAutoLoadControls,
  createColumn,
  createCountdownSpan,
  createDateSpan,
  createLabel,
  createLoadMoreButton,
  createMainContainer,
  createMetricsInfo,
  createMetricsSpans,
  createScrollTopButton,
  createSortButtons,
  createThreeColumnRow,
  setButtonState,
} from "./create-ui-components";
import isCommentHistoryPage from "./is-comment-history-page";
import { disconnectObserver, observeFeed } from "./observe-feed";
import {
  performSort,
  reinsertPosts,
  sortByImpressions,
  sortByReplies,
} from "./perform-sort";

/**
 * Main initialization function for comment history enhancement
 */
export function initializeCommentHistoryEnhancement(): void {
  // Check if we're on the right page
  if (!isCommentHistoryPage()) {
    return;
  }

  // Find the main LinkedIn column
  const coreRail = document.querySelector(
    ".pv-recent-activity-detail__core-rail",
  );
  if (!coreRail) {
    console.log(
      "[LinkedIn Metrics] .pv-recent-activity-detail__core-rail not found.",
    );
    return;
  }

  // Remove existing interface if any
  const prevMetricsDiv = document.getElementById("custom-linkedin-metrics");
  if (prevMetricsDiv) {
    prevMetricsDiv.remove();
  }

  // Create main container
  const metricsDiv = createMainContainer();
  coreRail.insertBefore(metricsDiv, coreRail.firstChild);

  // Date will be moved to metrics container

  // --- THREE COLUMN LAYOUT ---
  const threeColumnRow = createThreeColumnRow();
  metricsDiv.appendChild(threeColumnRow);

  // LEFT COLUMN - SPANS BOTH ROWS
  const leftColumn = document.createElement("div");
  leftColumn.style.gridColumn = "1";
  leftColumn.style.gridRow = "1 / 3";
  leftColumn.style.display = "flex";
  leftColumn.style.flexDirection = "column";
  leftColumn.style.gap = "6px";
  threeColumnRow.appendChild(leftColumn);

  // Auto Load label with countdown container
  const autoLoadLabelRow = document.createElement("div");
  autoLoadLabelRow.style.display = "flex";
  autoLoadLabelRow.style.alignItems = "center";
  autoLoadLabelRow.style.gap = "8px";
  autoLoadLabelRow.style.marginBottom = "2px";
  leftColumn.appendChild(autoLoadLabelRow);

  const autoLoadLabel = createLabel("Auto Load for (s):");
  autoLoadLabel.style.textAlign = "left";
  autoLoadLabel.style.marginBottom = "0px";
  autoLoadLabelRow.appendChild(autoLoadLabel);

  // Countdown display next to title
  const countdownSpan = createCountdownSpan();
  autoLoadLabelRow.appendChild(countdownSpan);

  // Auto Load controls (fills row)
  const {
    container: autoLoadContainer,
    input: autoLoadInput,
    button: autoLoadBtn,
  } = createAutoLoadControls();
  leftColumn.appendChild(autoLoadContainer);

  // Load More button
  const loadMoreBtn = createLoadMoreButton();
  leftColumn.appendChild(loadMoreBtn);

  // Create sort buttons once
  const { impressionsBtn: sortImpressionsBtn, repliesBtn: sortRepliesBtn } =
    createSortButtons();

  // MIDDLE COLUMN - SPANS BOTH ROWS
  const middleColumn = document.createElement("div");
  middleColumn.style.gridColumn = "2";
  middleColumn.style.gridRow = "1 / 3";
  middleColumn.style.display = "flex";
  middleColumn.style.flexDirection = "column";
  middleColumn.style.gap = "6px";
  middleColumn.style.alignItems = "stretch";
  threeColumnRow.appendChild(middleColumn);

  // Sort by label
  const sortLabel = createLabel("Sort by");
  sortLabel.style.textAlign = "left";
  sortLabel.style.marginBottom = "2px";
  middleColumn.appendChild(sortLabel);

  middleColumn.appendChild(sortImpressionsBtn);
  middleColumn.appendChild(sortRepliesBtn);

  // RIGHT COLUMN - Mimic structure of other columns
  const rightColumn = document.createElement("div");
  rightColumn.style.gridColumn = "3";
  rightColumn.style.gridRow = "1 / 3";
  rightColumn.style.display = "flex";
  rightColumn.style.flexDirection = "column";
  rightColumn.style.gap = "6px";
  threeColumnRow.appendChild(rightColumn);

  // Invisible title to match other columns' structure
  const invisibleTitle = createLabel("");
  invisibleTitle.style.textAlign = "left";
  invisibleTitle.style.marginBottom = "2px";
  invisibleTitle.style.visibility = "hidden";
  invisibleTitle.style.height = "1.2em"; // Same height as other titles
  rightColumn.appendChild(invisibleTitle);

  const scrollTopBtn = createScrollTopButton();
  rightColumn.appendChild(scrollTopBtn);

  // --- METRICS INFO (comments, impressions, and date) ---
  const metricsContainer = document.createElement("div");
  metricsContainer.style.display = "flex";
  metricsContainer.style.flexDirection = "column";
  metricsContainer.style.gap = "8px";
  metricsDiv.appendChild(metricsContainer);

  // Main metrics row
  const metricsInfo = createMetricsInfo();
  metricsContainer.appendChild(metricsInfo);

  const { countSpan, impressionsSpan } = createMetricsSpans();
  metricsInfo.appendChild(countSpan);
  metricsInfo.appendChild(impressionsSpan);

  // Date row inside metrics container
  const dateRow = document.createElement("div");
  dateRow.style.display = "flex";
  dateRow.style.justifyContent = "center";
  dateRow.style.alignItems = "center";
  dateRow.style.fontSize = "12px";
  dateRow.style.fontWeight = "500";
  dateRow.style.color = "#6b7280";
  dateRow.style.marginTop = "0px";
  metricsContainer.appendChild(dateRow);

  const dateSpan = createDateSpan();
  dateSpan.style.fontSize = "12px";
  dateSpan.style.fontWeight = "500";
  dateSpan.style.color = "#6b7280";
  dateRow.appendChild(dateSpan);

  // Initialize auto load manager
  const autoLoadManager = new AutoLoadManager(
    countSpan,
    impressionsSpan,
    dateSpan,
  );

  // --- EVENT HANDLERS ---

  // Load More button
  loadMoreBtn.onclick = function () {
    const btn = document.querySelector(
      ".scaffold-finite-scroll__load-button",
    ) as HTMLButtonElement;
    if (btn) btn.click();
    setTimeout(() => updateMetrics(countSpan, impressionsSpan, dateSpan), 500);
  };

  // Auto Load button
  autoLoadBtn.onclick = function () {
    if (autoLoadManager.isActive()) return;

    const seconds = parseInt(autoLoadInput.value, 10);
    if (isNaN(seconds) || seconds < 1) {
      alert("Please enter a valid number of seconds (>=1).");
      return;
    }

    autoLoadManager.start(seconds, autoLoadBtn, autoLoadInput, countdownSpan);
  };

  // Scroll Top button
  scrollTopBtn.onclick = function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sort buttons
  sortImpressionsBtn.onclick = function () {
    performSort(() => {
      sortByImpressions();
      updateMetrics(countSpan, impressionsSpan, dateSpan);
    }, sortImpressionsBtn);
  };

  sortRepliesBtn.onclick = function () {
    performSort(() => {
      sortByReplies();
      updateMetrics(countSpan, impressionsSpan, dateSpan);
    }, sortRepliesBtn);
  };

  // Initialize metrics display
  updateMetrics(countSpan, impressionsSpan, dateSpan);

  // Set up feed observer for live updates
  observeFeed(countSpan, impressionsSpan, dateSpan);

  // Auto-update metrics after a short delay to catch any posts that load
  setTimeout(() => {
    updateMetrics(countSpan, impressionsSpan, dateSpan);
  }, 1000);

  // Set up periodic metrics updates to catch naturally loaded posts
  setInterval(() => {
    updateMetrics(countSpan, impressionsSpan, dateSpan);
  }, 3000);

  console.log(
    "[LinkedIn Metrics] Comment history enhancement initialized successfully",
  );
}

/**
 * Cleanup function to remove the enhancement
 */
export function cleanupCommentHistoryEnhancement(): void {
  const metricsDiv = document.getElementById("custom-linkedin-metrics");
  if (metricsDiv) {
    metricsDiv.remove();
  }

  disconnectObserver();
  console.log("[LinkedIn Metrics] Comment history enhancement cleaned up");
}

// Initialize when this module is imported
initializeCommentHistoryEnhancement();
