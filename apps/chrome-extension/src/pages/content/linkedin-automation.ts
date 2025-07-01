import type { PostData } from "./linkedin-extractors";
import { AntiThrottlingAudioService } from "./anti-throttling-audio";
import { LinkedInExtractors } from "./linkedin-extractors";
import { StorageService } from "./storage-service";

/**
 * LinkedIn Automation Service
 *
 * SERVICE CLASS - Handles main automation flow and interactions
 * - Orchestrates the complete commenting automation process
 * - Manages post discovery, filtering, and commenting workflow
 * - Handles error recovery and retry logic
 * - Coordinates between extraction, storage, and UI interaction services
 */

export interface AutomationConfig {
  maxPosts: number;
  duplicateWindowHours: number;
  scrollDuration: number;
  commentDelay: number;
  timeFilterEnabled: boolean;
  minPostAgeHours: number;
}

export interface AutomationState {
  isRunning: boolean;
  currentPostIndex: number;
  commentCount: number;
  totalProcessed: number;
  errors: string[];
  startTime: Date;
}

export interface CommentResult {
  success: boolean;
  message: string;
  postData?: PostData;
  error?: Error;
}

export class LinkedInAutomationService {
  private config: AutomationConfig;
  private state: AutomationState;
  private actionTimes: number[] = [];
  private statusCallback?: (status: string, progress?: number) => void;

  constructor(config: AutomationConfig) {
    this.config = config;
    this.state = {
      isRunning: false,
      currentPostIndex: 0,
      commentCount: 0,
      totalProcessed: 0,
      errors: [],
      startTime: new Date(),
    };
  }

  /**
   * Set status update callback
   */
  setStatusCallback(
    callback: (status: string, progress?: number) => void,
  ): void {
    this.statusCallback = callback;
  }

  /**
   * Update status and notify callback
   */
  private updateStatus(status: string, progress?: number): void {
    console.log(`🤖 Automation Status: ${status}`);
    if (this.statusCallback) {
      this.statusCallback(status, progress);
    }
  }

  /**
   * Start the automation process
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      throw new Error("Automation is already running");
    }

    this.state.isRunning = true;
    this.state.startTime = new Date();
    this.state.errors = [];
    this.updateStatus("Starting LinkedIn automation...");

    try {
      await AntiThrottlingAudioService.initializeAudio(
        "/quiet-suburban-morning-brazil-18857.mp3",
      );
      await this.runAutomationLoop();
    } catch (error) {
      this.state.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      this.updateStatus("Automation stopped due to error");
      throw error;
    } finally {
      this.state.isRunning = false;
    }
  }

  /**
   * Stop the automation process
   */
  stop(): void {
    this.state.isRunning = false;
    this.updateStatus("Automation stopped by user");
  }

  /**
   * Get current automation state
   */
  getState(): AutomationState {
    return { ...this.state };
  }

  /**
   * Main automation loop
   */
  private async runAutomationLoop(): Promise<void> {
    while (
      this.state.isRunning &&
      this.state.commentCount < this.config.maxPosts
    ) {
      try {
        this.updateStatus(
          `Processing posts... (${this.state.commentCount}/${this.config.maxPosts})`,
          (this.state.commentCount / this.config.maxPosts) * 100,
        );

        // Find posts on current page
        const posts = LinkedInExtractors.findPostElements();

        if (posts.length === 0) {
          this.updateStatus("No posts found, scrolling to load more...");
          await this.scrollAndWait();
          continue;
        }

        // Process posts starting from current index
        let processedAnyPost = false;

        for (
          let i = this.state.currentPostIndex;
          i < posts.length && this.state.isRunning;
          i++
        ) {
          this.state.currentPostIndex = i;
          this.state.totalProcessed++;

          const post = posts[i];
          if (!post) continue;

          const result = await this.processPost(post);

          if (result.success) {
            this.state.commentCount++;
            processedAnyPost = true;

            if (this.state.commentCount >= this.config.maxPosts) {
              break;
            }
          }

          // Progressive delay to avoid detection
          await AntiThrottlingAudioService.progressiveDelay(
            this.state.totalProcessed,
            this.config.commentDelay,
          );
        }

        // If we processed posts, reset index for next page
        if (processedAnyPost) {
          this.state.currentPostIndex = 0;
        }

        // Scroll to load more posts
        if (this.state.commentCount < this.config.maxPosts) {
          this.updateStatus("Scrolling to load more posts...");
          await this.scrollAndWait();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error in automation loop";
        this.state.errors.push(errorMessage);
        console.error("❌ Error in automation loop:", error);

        // Wait before retrying
        await AntiThrottlingAudioService.antiDetectionDelay();
      }
    }

    this.updateStatus(
      `Automation completed! Commented on ${this.state.commentCount} posts.`,
    );
  }

  /**
   * Process a single post
   */
  private async processPost(postElement: Element): Promise<CommentResult> {
    try {
      // Extract post data
      const postData = LinkedInExtractors.extractPostData(postElement);

      if (!postData.content || postData.content.length < 10) {
        return {
          success: false,
          message: "Post content too short or empty",
          postData,
        };
      }

      // Check various filters
      const filterResult = await this.checkFilters(postData);
      if (!filterResult.passed) {
        return {
          success: false,
          message: filterResult.reason,
          postData,
        };
      }

      // Simulate reading the post
      await AntiThrottlingAudioService.readingDelay(postData.content);

      // Scroll post into view
      LinkedInExtractors.scrollIntoView(postElement);
      await AntiThrottlingAudioService.scrollingDelay(200);

      // Find and click comment button
      const commentButton = LinkedInExtractors.findCommentButton(postElement);
      if (!commentButton) {
        return {
          success: false,
          message: "Comment button not found",
          postData,
        };
      }

      // Click comment button
      await this.clickElement(commentButton);
      await AntiThrottlingAudioService.humanDelay({
        base: 1000,
        variation: 300,
        minimum: 700,
        maximum: 1500,
      });

      // Find comment text area
      const textArea = LinkedInExtractors.findCommentTextArea(postElement);
      if (!textArea) {
        return {
          success: false,
          message: "Comment text area not found",
          postData,
        };
      }

      // Generate comment via background script
      const comment = await this.generateComment(postData.content);
      if (!comment) {
        return {
          success: false,
          message: "Failed to generate comment",
          postData,
        };
      }

      // Type comment
      await this.typeComment(textArea, comment);

      // Find and click post button
      const postButton = LinkedInExtractors.findPostButton();
      if (!postButton) {
        return {
          success: false,
          message: "Post button not found",
          postData,
        };
      }

      // Submit comment
      await this.clickElement(postButton);

      // Wait for comment to be posted
      await AntiThrottlingAudioService.networkAwareDelay(2000);

      // Record successful comment
      await this.recordSuccess(postData);

      // Play success sound
      await AntiThrottlingAudioService.playSuccessSound();

      return {
        success: true,
        message: "Comment posted successfully",
        postData,
      };
    } catch (error) {
      await AntiThrottlingAudioService.playErrorSound();
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Check all filters for a post
   */
  private async checkFilters(
    postData: PostData,
  ): Promise<{ passed: boolean; reason: string }> {
    // Check if already commented on this post
    const hasCommented = await StorageService.hasCommentedOnPost(postData.urn);
    if (hasCommented) {
      await StorageService.incrementCounter("postsSkippedDuplicate");
      return {
        passed: false,
        reason: "Already commented on this post (URN match)",
      };
    }

    // Check author duplicate window
    const hasCommentedOnAuthor =
      await StorageService.hasCommentedOnAuthorRecently(
        postData.authorName,
        this.config.duplicateWindowHours,
      );
    if (hasCommentedOnAuthor) {
      await StorageService.incrementCounter("postsSkippedAlreadyCommented");
      return {
        passed: false,
        reason: `Already commented on ${postData.authorName} recently`,
      };
    }

    // Check time filter if enabled
    if (this.config.timeFilterEnabled) {
      const postTimestamp = LinkedInExtractors.extractPostTimestamp(
        postData.postElement,
      );
      if (postTimestamp) {
        const postAge =
          (Date.now() - postTimestamp.getTime()) / (1000 * 60 * 60); // hours
        if (postAge < this.config.minPostAgeHours) {
          await StorageService.incrementCounter("postsSkippedTimeFilter");
          return {
            passed: false,
            reason: `Post too recent (${postAge.toFixed(1)}h < ${this.config.minPostAgeHours}h)`,
          };
        }
      }
    }

    return { passed: true, reason: "All filters passed" };
  }

  /**
   * Generate comment using background script
   */
  private async generateComment(postContent: string): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "generateComment",
          postContent: postContent,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error generating comment:",
              chrome.runtime.lastError,
            );
            resolve(null);
          } else if (response && response.success) {
            resolve(response.comment);
          } else {
            console.error("Failed to generate comment:", response?.error);
            resolve(null);
          }
        },
      );
    });
  }

  /**
   * Type comment into text area
   */
  private async typeComment(textArea: Element, comment: string): Promise<void> {
    // Focus the text area
    await this.focusElement(textArea);
    await AntiThrottlingAudioService.humanDelay({
      base: 500,
      variation: 200,
      minimum: 300,
      maximum: 800,
    });

    // Clear any existing content
    if (textArea instanceof HTMLElement) {
      textArea.innerHTML = "";
      textArea.textContent = "";
    }

    // Type comment with human-like timing
    await this.typeText(textArea, comment);

    // Wait for typing to complete
    await AntiThrottlingAudioService.typingDelay(comment);
  }

  /**
   * Simulate human typing
   */
  private async typeText(element: Element, text: string): Promise<void> {
    for (const char of text) {
      // Type character
      if (element instanceof HTMLElement) {
        element.textContent = (element.textContent || "") + char;

        // Trigger input events
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("keydown", { bubbles: true }));
        element.dispatchEvent(new Event("keyup", { bubbles: true }));
      }

      // Random typing delay between characters
      const charDelay = AntiThrottlingAudioService.getRandomDelay(50, 150);
      await AntiThrottlingAudioService.sleep(charDelay);
    }
  }

  /**
   * Click element with human-like behavior
   */
  private async clickElement(element: Element): Promise<void> {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Mouse movement delay
    await AntiThrottlingAudioService.mouseMovementDelay(0, 0, centerX, centerY);

    // Click the element
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    }

    // Brief delay after click
    await AntiThrottlingAudioService.humanDelay({
      base: 200,
      variation: 100,
      minimum: 100,
      maximum: 400,
    });
  }

  /**
   * Focus element
   */
  private async focusElement(element: Element): Promise<void> {
    if (element instanceof HTMLElement) {
      element.focus();
    }

    element.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    await AntiThrottlingAudioService.humanDelay({
      base: 300,
      variation: 100,
      minimum: 200,
      maximum: 500,
    });
  }

  /**
   * Scroll and wait for content to load
   */
  private async scrollAndWait(): Promise<void> {
    // Scroll down by viewport height
    const scrollDistance = window.innerHeight * 0.8;

    window.scrollBy({
      top: scrollDistance,
      behavior: "smooth",
    });

    await AntiThrottlingAudioService.scrollingDelay(scrollDistance);

    // Wait for additional content to load
    await AntiThrottlingAudioService.humanDelay({
      base: this.config.scrollDuration,
      variation: 500,
      minimum: 1000,
      maximum: 5000,
    });
  }

  /**
   * Record successful comment
   */
  private async recordSuccess(postData: PostData): Promise<void> {
    // Record action time for burst protection
    this.actionTimes.push(Date.now());

    // Keep only last hour of action times
    const oneHourAgo = Date.now() - 3600000;
    this.actionTimes = this.actionTimes.filter((time) => time > oneHourAgo);

    // Save to storage
    await StorageService.saveCommentedPostUrn(postData.urn);
    await StorageService.saveCommentedAuthorWithTimestamp(postData.authorName);
    await StorageService.updateCommentCounts();

    console.log(`✅ Successfully commented on post by ${postData.authorName}`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    successRate: number;
    postsPerMinute: number;
    errorsCount: number;
    runtime: number;
  } {
    const runtime = Date.now() - this.state.startTime.getTime();
    const runtimeMinutes = runtime / (1000 * 60);

    return {
      successRate:
        this.state.totalProcessed > 0
          ? (this.state.commentCount / this.state.totalProcessed) * 100
          : 0,
      postsPerMinute:
        runtimeMinutes > 0 ? this.state.commentCount / runtimeMinutes : 0,
      errorsCount: this.state.errors.length,
      runtime: runtime,
    };
  }
}
