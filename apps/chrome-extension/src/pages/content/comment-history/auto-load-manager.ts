/**
 * Auto-load manager for LinkedIn comment history
 */

import { updateMetrics } from "./calculate-metrics";

export class AutoLoadManager {
  private autoLoadActive = false;
  private autoLoadTimer: number | null = null;
  private autoLoadInterval: number | null = null;
  private autoLoadCountdownInterval: number | null = null;
  private autoLoadMetricsInterval: number | null = null;

  constructor(
    private countSpan: HTMLElement,
    private impressionsSpan: HTMLElement,
    private dateSpan: HTMLElement,
  ) {}

  /**
   * Starts auto-loading for the specified duration
   */
  start(
    seconds: number,
    autoLoadBtn: HTMLButtonElement,
    autoLoadInput: HTMLInputElement,
    countdownSpan: HTMLSpanElement,
  ): void {
    if (this.autoLoadActive) return;

    this.autoLoadActive = true;
    autoLoadBtn.textContent = "Loading...";
    autoLoadBtn.disabled = true;
    autoLoadInput.disabled = true;

    const endTime = Date.now() + seconds * 1000;

    // Show and update countdown
    countdownSpan.style.display = "";
    const updateCountdown = () => {
      const left = Math.ceil((endTime - Date.now()) / 1000);
      countdownSpan.textContent = left > 0 ? `⏳ ${left}s left` : "";
      if (left <= 0) {
        countdownSpan.style.display = "none";
        if (this.autoLoadCountdownInterval) {
          clearInterval(this.autoLoadCountdownInterval);
          this.autoLoadCountdownInterval = null;
        }
      }
    };

    updateCountdown();
    this.autoLoadCountdownInterval = window.setInterval(updateCountdown, 500);

    // Live metrics update during auto load
    this.autoLoadMetricsInterval = window.setInterval(() => {
      updateMetrics(this.countSpan, this.impressionsSpan, this.dateSpan);
    }, 600);

    const doScroll = () => {
      if (Date.now() > endTime) {
        this.stop(autoLoadBtn, autoLoadInput, countdownSpan);
        return;
      }

      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

      setTimeout(() => {
        updateMetrics(this.countSpan, this.impressionsSpan, this.dateSpan);
      }, 400);

      const btn = document.querySelector(
        ".scaffold-finite-scroll__load-button",
      ) as HTMLButtonElement;
      if (btn && !btn.disabled) {
        btn.click();
      }
    };

    this.autoLoadInterval = window.setInterval(doScroll, 1500);
    this.autoLoadTimer = window.setTimeout(
      () => {
        this.stop(autoLoadBtn, autoLoadInput, countdownSpan);
      },
      seconds * 1000 + 400,
    );
  }

  /**
   * Stops auto-loading
   */
  stop(
    autoLoadBtn: HTMLButtonElement,
    autoLoadInput: HTMLInputElement,
    countdownSpan: HTMLSpanElement,
  ): void {
    this.autoLoadActive = false;
    autoLoadBtn.textContent = "Start";
    autoLoadBtn.disabled = false;
    autoLoadInput.disabled = false;
    countdownSpan.style.display = "none";

    if (this.autoLoadInterval) {
      clearInterval(this.autoLoadInterval);
      this.autoLoadInterval = null;
    }
    if (this.autoLoadTimer) {
      clearTimeout(this.autoLoadTimer);
      this.autoLoadTimer = null;
    }
    if (this.autoLoadCountdownInterval) {
      clearInterval(this.autoLoadCountdownInterval);
      this.autoLoadCountdownInterval = null;
    }
    if (this.autoLoadMetricsInterval) {
      clearInterval(this.autoLoadMetricsInterval);
      this.autoLoadMetricsInterval = null;
    }

    updateMetrics(this.countSpan, this.impressionsSpan, this.dateSpan);
  }

  /**
   * Checks if auto-loading is currently active
   */
  isActive(): boolean {
    return this.autoLoadActive;
  }
}
