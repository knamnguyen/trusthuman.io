/**
 * Anti-throttling and Audio Service
 *
 * SERVICE CLASS - Handles rate limiting, delays, and audio feedback
 * - Provides human-like delays and randomization to avoid detection
 * - Manages audio feedback for user interaction
 * - Implements anti-throttling strategies for automation
 * - Centralized timing and audio logic separate from automation flow
 */

export interface DelayConfig {
  base: number;
  variation: number;
  minimum: number;
  maximum: number;
}

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  audioUrl?: string;
}

export class AntiThrottlingAudioService {
  private static audioContext: AudioContext | null = null;
  private static audioBuffer: AudioBuffer | null = null;
  private static audioConfig: AudioConfig = {
    enabled: true,
    volume: 0.5,
  };

  /**
   * Initialize audio system
   */
  static async initializeAudio(audioUrl?: string): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      if (audioUrl) {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        console.log("🔊 Audio system initialized with custom audio");
      } else {
        // Create a simple beep sound programmatically
        await this.createBeepSound();
        console.log("🔊 Audio system initialized with generated beep");
      }
    } catch (error) {
      console.warn("⚠️ Could not initialize audio system:", error);
    }
  }

  /**
   * Create a simple beep sound programmatically
   */
  private static async createBeepSound(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2; // 200ms beep
    const frequency = 800; // 800Hz tone

    const buffer = this.audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
    }

    this.audioBuffer = buffer;
  }

  /**
   * Play success sound
   */
  static async playSuccessSound(): Promise<void> {
    if (!this.audioConfig.enabled || !this.audioContext || !this.audioBuffer) {
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.audioBuffer;
      gainNode.gain.value = this.audioConfig.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
      console.log("🔊 Played success sound");
    } catch (error) {
      console.warn("⚠️ Could not play success sound:", error);
    }
  }

  /**
   * Play error sound (different pitch)
   */
  static async playErrorSound(): Promise<void> {
    if (!this.audioConfig.enabled || !this.audioContext) {
      return;
    }

    try {
      // Create a lower pitched error sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime); // Lower frequency
      oscillator.type = "square"; // Different waveform for error

      gainNode.gain.setValueAtTime(
        this.audioConfig.volume,
        this.audioContext.currentTime,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3,
      );

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

      console.log("🔊 Played error sound");
    } catch (error) {
      console.warn("⚠️ Could not play error sound:", error);
    }
  }

  /**
   * Configure audio settings
   */
  static configureAudio(config: Partial<AudioConfig>): void {
    this.audioConfig = { ...this.audioConfig, ...config };
    console.log("🔊 Audio configuration updated:", this.audioConfig);
  }

  /**
   * Human-like delay with randomization
   */
  static async humanDelay(config: DelayConfig): Promise<void> {
    const variation = (Math.random() - 0.5) * 2 * config.variation;
    const delay = Math.max(
      config.minimum,
      Math.min(config.maximum, config.base + variation),
    );

    console.log(
      `⏳ Human delay: ${delay}ms (base: ${config.base}ms, variation: ±${config.variation}ms)`,
    );
    await this.sleep(delay);
  }

  /**
   * Typing delay simulation
   */
  static async typingDelay(text: string, wpmBase: number = 60): Promise<void> {
    // Calculate typing time based on words per minute
    const words = text.split(" ").length;
    const charactersPerMinute = wpmBase * 5; // Average 5 characters per word
    const baseTimeMs = (text.length / charactersPerMinute) * 60 * 1000;

    // Add human-like variation (±30%)
    const variation = baseTimeMs * 0.3;
    const actualTime = baseTimeMs + (Math.random() - 0.5) * 2 * variation;

    // Ensure minimum and maximum bounds
    const finalTime = Math.max(500, Math.min(10000, actualTime));

    console.log(
      `⌨️ Typing delay: ${finalTime}ms for ${text.length} characters (${words} words)`,
    );
    await this.sleep(finalTime);
  }

  /**
   * Reading delay simulation
   */
  static async readingDelay(
    content: string,
    wpmReading: number = 200,
  ): Promise<void> {
    const words = content.split(/\s+/).length;
    const readingTimeMs = (words / wpmReading) * 60 * 1000;

    // Add variation for human-like reading (±20%)
    const variation = readingTimeMs * 0.2;
    const actualTime = readingTimeMs + (Math.random() - 0.5) * 2 * variation;

    // Minimum 1 second, maximum 30 seconds for reading
    const finalTime = Math.max(1000, Math.min(30000, actualTime));

    console.log(`📖 Reading delay: ${finalTime}ms for ${words} words`);
    await this.sleep(finalTime);
  }

  /**
   * Scrolling delay with momentum simulation
   */
  static async scrollingDelay(distance: number): Promise<void> {
    // Base time proportional to scroll distance
    const baseTime = Math.abs(distance) * 0.5; // 0.5ms per pixel

    // Add momentum-like behavior
    const momentumTime = Math.sqrt(Math.abs(distance)) * 10;

    const totalTime = Math.max(200, Math.min(2000, baseTime + momentumTime));

    console.log(`📜 Scrolling delay: ${totalTime}ms for ${distance}px`);
    await this.sleep(totalTime);
  }

  /**
   * Anti-detection randomized delay
   */
  static async antiDetectionDelay(): Promise<void> {
    // Random delay between 500ms and 3000ms to break patterns
    const minDelay = 500;
    const maxDelay = 3000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);

    console.log(`🕵️ Anti-detection delay: ${delay}ms`);
    await this.sleep(delay);
  }

  /**
   * Progressive delay that increases with consecutive actions
   */
  static async progressiveDelay(
    actionCount: number,
    baseDelay: number = 1000,
  ): Promise<void> {
    // Increase delay exponentially but cap it
    const multiplier = Math.min(1 + actionCount * 0.2, 3); // Max 3x multiplier
    const delay = baseDelay * multiplier;

    console.log(
      `📈 Progressive delay: ${delay}ms (action #${actionCount}, multiplier: ${multiplier.toFixed(1)}x)`,
    );
    await this.sleep(delay);
  }

  /**
   * Network-aware delay (simulates slower action on poor connection)
   */
  static async networkAwareDelay(baseDelay: number = 1000): Promise<void> {
    let networkMultiplier = 1;

    // Check connection if available
    if ("connection" in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;

      switch (connection.effectiveType) {
        case "slow-2g":
          networkMultiplier = 3;
          break;
        case "2g":
          networkMultiplier = 2;
          break;
        case "3g":
          networkMultiplier = 1.5;
          break;
        case "4g":
        default:
          networkMultiplier = 1;
          break;
      }
    }

    const delay = baseDelay * networkMultiplier;
    console.log(
      `🌐 Network-aware delay: ${delay}ms (multiplier: ${networkMultiplier}x)`,
    );
    await this.sleep(delay);
  }

  /**
   * Time-of-day aware delay (slower during peak hours)
   */
  static async timeAwareDelay(baseDelay: number = 1000): Promise<void> {
    const hour = new Date().getHours();
    let timeMultiplier = 1;

    // Peak hours (9-11 AM, 1-3 PM, 7-9 PM) have slower delays
    if (
      (hour >= 9 && hour <= 11) ||
      (hour >= 13 && hour <= 15) ||
      (hour >= 19 && hour <= 21)
    ) {
      timeMultiplier = 1.5;
    }

    const delay = baseDelay * timeMultiplier;
    console.log(
      `🕐 Time-aware delay: ${delay}ms (hour: ${hour}, multiplier: ${timeMultiplier}x)`,
    );
    await this.sleep(delay);
  }

  /**
   * Burst protection delay (longer delay after rapid actions)
   */
  static async burstProtectionDelay(
    recentActionTimes: number[],
    maxActionsPerMinute: number = 10,
    baseDelay: number = 1000,
  ): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Count actions in the last minute
    const recentActions = recentActionTimes.filter(
      (time) => time > oneMinuteAgo,
    );

    if (recentActions.length >= maxActionsPerMinute) {
      // Calculate how long to wait until we're under the limit
      const oldestRecentAction = Math.min(...recentActions);
      const waitTime = oldestRecentAction + 60000 - now + baseDelay;

      console.log(
        `🛡️ Burst protection delay: ${waitTime}ms (${recentActions.length} actions in last minute)`,
      );
      await this.sleep(Math.max(waitTime, baseDelay));
    } else {
      console.log(
        `✅ Burst protection passed (${recentActions.length}/${maxActionsPerMinute} actions)`,
      );
      await this.sleep(baseDelay);
    }
  }

  /**
   * Basic sleep utility
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a delay configuration object
   */
  static createDelayConfig(
    base: number,
    variationPercent: number = 20,
    minimum?: number,
    maximum?: number,
  ): DelayConfig {
    const variation = base * (variationPercent / 100);
    return {
      base,
      variation,
      minimum: minimum ?? Math.max(100, base - variation),
      maximum: maximum ?? base + variation * 2,
    };
  }

  /**
   * Get random delay within bounds
   */
  static getRandomDelay(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Simulate mouse movement delay
   */
  static async mouseMovementDelay(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<void> {
    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
    );
    const baseTime = distance * 0.8; // 0.8ms per pixel
    const variation = baseTime * 0.3;
    const delay = baseTime + (Math.random() - 0.5) * 2 * variation;

    const finalDelay = Math.max(50, Math.min(500, delay));
    console.log(
      `🖱️ Mouse movement delay: ${finalDelay}ms for ${distance.toFixed(0)}px`,
    );
    await this.sleep(finalDelay);
  }
}
