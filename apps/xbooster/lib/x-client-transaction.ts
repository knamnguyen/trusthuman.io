/**
 * XClientTransactionManager — TypeScript port of EngageX's transaction ID generator.
 *
 * Generates `x-client-transaction-id` headers that mimic Twitter's real web client,
 * making API requests indistinguishable from genuine browser traffic.
 *
 * Algorithm overview:
 *   1. Parse x.com homepage HTML for `twitter-site-verification` meta tag (base64 key)
 *   2. Fetch `ondemand.s.*.js` bundle to extract byte-index ordering
 *   3. Extract SVG path data from loading animation elements
 *   4. Derive an "animation key" via cubic-bezier interpolation, rotation matrices,
 *      and color/hex encoding
 *   5. SHA-256 hash of `"{method}!{path}!{timestamp}{keyword}{animationKey}"`
 *   6. XOR the hash with a random byte, base64-encode, strip trailing `=`
 *
 * Ported from: engageX/api/api-combined.js
 */

import { sha256 } from "js-sha256";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RANDOM_KEYWORD = "obfiowerehiring";
const RANDOM_NUMBER = 3;
const ONDEMAND_URL_TEMPLATE =
  "https://abs.twimg.com/responsive-web/client-web/ondemand.s.{filename}a.js";
const ONDEMAND_HASH_REGEX = /['"]ondemand\.s['"]:\s*['"]([\w]*)['"]/m;
const INDICES_REGEX = /(\(\w\[(\d{1,2})\],\s*16\))/g;
const TIMESTAMP_EPOCH = 1682924400000; // ~May 1, 2023

// ---------------------------------------------------------------------------
// Cubic Bezier
// ---------------------------------------------------------------------------

class CubicBezier {
  private curves: readonly [number, number, number, number];

  constructor(curves: readonly [number, number, number, number]) {
    this.curves = curves;
  }

  getValue(t: number): number {
    let slope = 0;
    let slope2 = 0;
    let low = 0;
    let mid = 0;
    let high = 1;

    if (t <= 0) {
      if (this.curves[0] > 0) {
        slope = this.curves[1] / this.curves[0];
      } else if (this.curves[1] === 0 && this.curves[2] > 0) {
        slope = this.curves[3] / this.curves[2];
      }
      return slope * t;
    }

    if (t >= 1) {
      if (this.curves[2] < 1) {
        slope2 = (this.curves[3] - 1) / (this.curves[2] - 1);
      } else if (this.curves[2] === 1 && this.curves[0] < 1) {
        slope2 = (this.curves[1] - 1) / (this.curves[0] - 1);
      }
      return 1 + slope2 * (t - 1);
    }

    while (low < high) {
      mid = (low + high) / 2;
      const x = CubicBezier.calculate(this.curves[0], this.curves[2], mid);
      if (Math.abs(t - x) < 1e-5) {
        return CubicBezier.calculate(this.curves[1], this.curves[3], mid);
      }
      if (x < t) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return CubicBezier.calculate(this.curves[1], this.curves[3], mid);
  }

  static calculate(p1: number, p2: number, t: number): number {
    return 3 * p1 * (1 - t) * (1 - t) * t + 3 * p2 * (1 - t) * t * t + t * t * t;
  }
}

// ---------------------------------------------------------------------------
// Interpolation utilities
// ---------------------------------------------------------------------------

function interpolate(a: number[], b: number[], progress: number): number[] {
  const len = Math.min(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    const v = interpolateNum(a[i]!, b[i]!, progress);
    result.push(v ?? 0);
  }
  return result;
}

function interpolateNum(
  a: number | boolean,
  b: number | boolean,
  progress: number,
): number | undefined {
  if (typeof a === "number" && typeof b === "number") {
    return a * (1 - progress) + b * progress;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return progress < 0.5 ? (a ? 1 : 0) : (b ? 1 : 0);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Rotation matrix
// ---------------------------------------------------------------------------

function convertRotationToMatrix(degrees: number): number[] {
  const rad = (degrees * Math.PI) / 180;
  return [Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)];
}

// ---------------------------------------------------------------------------
// Math utility (matching EngageX's MathUtil.round)
// ---------------------------------------------------------------------------

class MathUtil {
  static round(value: number): number {
    const floor = Math.floor(value);
    return value - floor >= 0.5 ? Math.ceil(value) : Math.sign(value) * floor;
  }
}

// ---------------------------------------------------------------------------
// Hex / encoding helpers
// ---------------------------------------------------------------------------

function floatToHex(value: number): string {
  const chars: string[] = [];
  let intPart = Math.trunc(value);
  let fracPart = value - intPart;

  let n = intPart;
  while (n > 0) {
    const div = Math.trunc(n / 16);
    const rem = n - 16 * div;
    chars.unshift(rem > 9 ? String.fromCharCode(rem + 55) : String(rem));
    n = div;
  }

  if (fracPart === 0) return chars.join("");

  chars.push(".");
  let f = fracPart;
  while (f > 0) {
    f *= 16;
    const digit = Math.trunc(f);
    f -= digit;
    chars.push(digit > 9 ? String.fromCharCode(digit + 55) : String(digit));
  }

  return chars.join("");
}

function isOdd(n: number): number {
  return n % 2 ? -1 : 0;
}

function base64Encode(input: Uint8Array | string): string {
  if (typeof input === "string") {
    return btoa(input);
  }
  let binary = "";
  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64Decode(encoded: string): string {
  return atob(encoded);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateResponse(response: unknown): asserts response is string {
  if (typeof response !== "string") {
    throw new TypeError(
      "the response object must be string, not " + typeof response,
    );
  }
}

// ---------------------------------------------------------------------------
// Ondemand URL helper
// ---------------------------------------------------------------------------

function getOndemandFileUrl(pageSource: string): string | null {
  const match = ONDEMAND_HASH_REGEX.exec(pageSource);
  return match ? ONDEMAND_URL_TEMPLATE.replace("{filename}", match[1]!) : null;
}

// ---------------------------------------------------------------------------
// ClientTransaction
// ---------------------------------------------------------------------------

class ClientTransaction {
  private homePageResponse: string;
  private ondemandFileResponse: string;
  private randomKeyword: string;
  private randomNumber: number;

  private rowIndex: number;
  private keyBytesIndices: number[];
  private key: string;
  private keyBytes: number[];
  private animationKey: string;

  constructor(
    homePageResponse: string,
    ondemandFileResponse: string,
    randomKeyword: string | null = null,
    randomNumber: number | null = null,
  ) {
    validateResponse(homePageResponse);
    validateResponse(ondemandFileResponse);

    this.homePageResponse = homePageResponse;
    this.ondemandFileResponse = ondemandFileResponse;
    this.randomKeyword = randomKeyword ?? RANDOM_KEYWORD;
    this.randomNumber = randomNumber ?? RANDOM_NUMBER;

    const indices = this.getIndices(this.ondemandFileResponse);
    this.rowIndex = indices[0]!;
    this.keyBytesIndices = indices.slice(1);
    this.key = this.getKey(this.homePageResponse);
    this.keyBytes = this.getKeyBytes(this.key);
    this.animationKey = this.getAnimationKey(this.keyBytes, this.homePageResponse);
  }

  // -----------------------------------------------------------------------
  // Index extraction from ondemand bundle
  // -----------------------------------------------------------------------

  private getIndices(source: string): number[] {
    let matches = [...source.matchAll(INDICES_REGEX)];

    if (matches.length === 0) {
      const fallback1 = /\[(\d{1,2})\]/g;
      matches = [...source.matchAll(fallback1)];
    }

    if (matches.length === 0) {
      const fallback2 = /(\d{1,2})/g;
      matches = [...source.matchAll(fallback2)];
    }

    if (matches.length === 0) {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }

    const parsed = matches.map((m) => parseInt(m[1] ?? m[0]!, 10));
    if (parsed.length < 2) {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }

    return [parsed[0]!, ...parsed.slice(1)];
  }

  // -----------------------------------------------------------------------
  // Key extraction (twitter-site-verification)
  // -----------------------------------------------------------------------

  private getKey(html: string): string {
    const match = html.match(
      /<meta[^>]*name=['"]twitter-site-verification['"][^>]*content=['"]([^'"]+)['"]/,
    );
    if (!match) {
      console.warn(
        "xBooster: Could not extract [twitter-site-verification] key from page source",
      );
    }
    return match?.[1] ?? "";
  }

  // -----------------------------------------------------------------------
  // Key bytes (base64 decode to byte array)
  // -----------------------------------------------------------------------

  private getKeyBytes(key: string): number[] {
    const decoded = base64Decode(key);
    return Array.from(decoded, (ch) => ch.charCodeAt(0));
  }

  // -----------------------------------------------------------------------
  // SVG frames from loading-x-anim elements
  // -----------------------------------------------------------------------

  private getFrames(html: string): string[] {
    const regex =
      /id=['"]loading-x-anim-\d+['"][^>]*>.*?<path[^>]*d=['"]([^'"]+)['"]/gs;
    const paths: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      paths.push(m[1]!);
    }
    if (paths.length === 0) {
      return [
        "M0,0C0,0,100,100,200,200C300,300,400,400,500,500",
        "M0,0C0,0,150,150,250,250C350,350,450,450,550,550",
        "M0,0C0,0,200,200,300,300C400,400,500,500,600,600",
        "M0,0C0,0,250,250,350,350C450,450,550,550,650,650",
      ];
    }
    return paths;
  }

  // -----------------------------------------------------------------------
  // Parse SVG path into 2D numeric array
  // -----------------------------------------------------------------------

  private get2dArray(
    keyBytes: number[],
    html: string,
    frames: string[] | null = null,
  ): number[][] {
    if (frames === null) {
      frames = this.getFrames(html);
    }

    if (!frames || frames.length === 0) {
      return [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]];
    }

    const pathStr = frames[keyBytes[5]! % frames.length];

    if (!pathStr || typeof pathStr !== "string") {
      return [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]];
    }

    return pathStr
      .slice(9)
      .split("C")
      .map((segment) =>
        segment
          .replace(/[^\d]+/g, " ")
          .trim()
          .split(/\s+/)
          .map(Number),
      );
  }

  // -----------------------------------------------------------------------
  // Byte-to-range mapping
  // -----------------------------------------------------------------------

  private solve(
    byteVal: number,
    low: number,
    high: number,
    floor: boolean,
  ): number {
    const mapped = (byteVal * (high - low)) / 255 + low;
    return floor ? Math.floor(mapped) : Math.round(mapped * 100) / 100;
  }

  // -----------------------------------------------------------------------
  // Core animation step
  // -----------------------------------------------------------------------

  private animate(data: number[], progress: number): string {
    const startColor = data.slice(0, 3).map(Number).concat([1]);
    const endColor = data.slice(3, 6).map(Number).concat([1]);
    const startRotation = [0];
    const endRotation = [this.solve(data[6]!, 60, 360, true)];

    const bezierData = data.slice(7);
    const curveValues = bezierData.map((val, idx) =>
      this.solve(val, isOdd(idx), 1, false),
    );

    const bezier = new CubicBezier(
      curveValues as unknown as readonly [number, number, number, number],
    );
    const t = bezier.getValue(progress);

    let color = interpolate(startColor, endColor, t);
    color = color.map((v) => Math.max(0, Math.min(255, v)));

    const rotation = convertRotationToMatrix(
      interpolate(startRotation, endRotation, t)[0]!,
    );

    const hexParts: string[] = color
      .slice(0, 3)
      .map((v) => Math.round(v).toString(16));

    for (const matVal of rotation) {
      let absVal = Math.round(matVal * 100) / 100;
      if (absVal < 0) absVal = -absVal;
      const hex = floatToHex(absVal);
      hexParts.push(hex.startsWith(".") ? `0${hex}`.toLowerCase() : hex || "0");
    }

    hexParts.push("0", "0");

    return hexParts.join("").replace(/[.-]/g, "");
  }

  // -----------------------------------------------------------------------
  // Animation key computation
  // -----------------------------------------------------------------------

  private getAnimationKey(keyBytes: number[], html: string): string {
    const totalSteps = 4096;
    const rowSelector = keyBytes[this.rowIndex]! % 16;
    const product = this.keyBytesIndices.reduce(
      (acc, idx) => acc * (keyBytes[idx]! % 16),
      1,
    );
    const rounded = 10 * MathUtil.round(product / 10);
    const array2d = this.get2dArray(keyBytes, html);

    if (!array2d || array2d.length === 0) {
      return "fallback-animation-key";
    }

    const row = array2d[rowSelector % array2d.length]!;
    const progress = rounded / totalSteps;

    try {
      return this.animate(row, progress);
    } catch {
      return "fallback-animation-key";
    }
  }

  // -----------------------------------------------------------------------
  // Transaction ID generation
  // -----------------------------------------------------------------------

  generateTransactionId(
    method: string,
    path: string,
    html: string | null = null,
    key: string | null = null,
    animationKey: string | null = null,
    timestamp: number | null = null,
  ): string {
    const ts =
      timestamp ?? Math.floor((Date.now() - TIMESTAMP_EPOCH) / 1000);

    const timeBytes = [
      ts & 0xff,
      (ts >> 8) & 0xff,
      (ts >> 16) & 0xff,
      (ts >> 24) & 0xff,
    ];

    const resolvedKey = key ?? this.key ?? this.getKey(html ?? "");
    const resolvedKeyBytes = this.getKeyBytes(resolvedKey);
    const resolvedAnimationKey =
      animationKey ??
      this.animationKey ??
      this.getAnimationKey(resolvedKeyBytes, html ?? "");

    const hashInput = `${method}!${path}!${ts}${this.randomKeyword}${resolvedAnimationKey}`;
    const hashBytes: number[] = sha256.array(hashInput);

    const randomByte = Math.floor(256 * Math.random());
    const payload = [
      ...resolvedKeyBytes,
      ...timeBytes,
      ...hashBytes.slice(0, 16),
      this.randomNumber,
    ];
    const xored = [randomByte, ...payload.map((b) => b ^ randomByte)];

    return base64Encode(Uint8Array.from(xored)).replace(/=+$/, "");
  }
}

// ---------------------------------------------------------------------------
// Default / fallback transaction ID
// ---------------------------------------------------------------------------

function generateDefaultTransactionId(): string {
  const timestamp = Date.now();
  const randomHex = Math.random().toString(16).slice(2, 10);
  const raw = `e:web:${timestamp}:${randomHex}`;
  return base64Encode(raw).replace(/=+$/, "");
}

const HARDCODED_FALLBACK_TRANSACTION_ID = "fallback-transaction-id";

// ---------------------------------------------------------------------------
// XClientTransactionManager
// ---------------------------------------------------------------------------

export class XClientTransactionManager {
  private homeHtml: string | null = null;
  private ondemandJs: string | null = null;
  private ct: ClientTransaction | null = null;
  private initialized = false;

  /**
   * Initialize the transaction manager by reading the current page HTML
   * and fetching the ondemand bundle.
   *
   * Must be called on an x.com page where `document` is available.
   */
  async initialize(): Promise<boolean> {
    try {
      this.homeHtml = document.documentElement.outerHTML;
      this.ondemandJs = await this.getOndemandJs();

      if (!this.ondemandJs) {
        console.warn("xBooster: Could not retrieve ondemand script content");
        return false;
      }

      this.ct = new ClientTransaction(this.homeHtml, this.ondemandJs);
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn("xBooster: XClientTransactionManager initialization failed:", err);
      return false;
    }
  }

  /**
   * Generate a transaction ID for a given HTTP method + path.
   *
   * Falls back gracefully:
   *   1. Real generation (if initialized)
   *   2. Default fallback (base64 of "e:web:{ts}:{hex}")
   *   3. Hardcoded string
   */
  generateTransactionId(method: string, path: string): string {
    if (this.ct) {
      try {
        return this.ct.generateTransactionId(method, path);
      } catch (err) {
        console.warn("xBooster: Transaction ID generation failed, using fallback:", err);
      }
    }

    try {
      return generateDefaultTransactionId();
    } catch {
      return HARDCODED_FALLBACK_TRANSACTION_ID;
    }
  }

  /**
   * Whether the manager has been successfully initialized.
   */
  isReady(): boolean {
    return this.initialized;
  }

  // -----------------------------------------------------------------------
  // Private: locate and fetch the ondemand.s.*.js bundle
  // -----------------------------------------------------------------------

  private async getOndemandJs(): Promise<string | null> {
    // Strategy 1: find the script tag directly in the DOM
    const scriptUrl = this.findOndemandScriptUrl();
    if (scriptUrl) {
      return this.fetchScriptContent(scriptUrl);
    }

    // Strategy 2: parse the homepage HTML for the ondemand hash
    if (this.homeHtml) {
      const constructedUrl = getOndemandFileUrl(this.homeHtml);
      if (constructedUrl) {
        return this.fetchScriptContent(constructedUrl);
      }
    }

    return null;
  }

  private findOndemandScriptUrl(): string | null {
    const selectors = [
      'script[src*="ondemand.s"]',
      'script[src*="ondemand"]',
      'script[src*="client-web"]',
      'script[src*="responsive-web"]',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        const src = (elements[0] as HTMLScriptElement).src;
        if (src) return src;
      }
    }

    return null;
  }

  private async fetchScriptContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`xBooster: Failed to fetch ondemand script (HTTP ${response.status})`);
        return null;
      }
      return response.text();
    } catch (err) {
      console.warn("xBooster: Error fetching ondemand script:", err);
      return null;
    }
  }
}
