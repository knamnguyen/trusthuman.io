# Extension Anti-Detection Plan

## Overview

Prevent LinkedIn (and other websites) from detecting that users have the EngageKit extension installed. This protects user privacy and prevents potential account restrictions.

## Background

Websites can fingerprint browser extensions through:
1. **Web Accessible Resources (WAR)** - Probing `chrome-extension://EXTENSION_ID/resource`
2. **DOM scanning** - Looking for injected elements with known IDs/classes
3. **Timing attacks** - Measuring response times for resource requests
4. **Console log patterns** - Detecting branded log messages

## Implementation Tasks

### Phase 1: Critical (Immediate)

#### 1.1 Enable `use_dynamic_url` for Web Accessible Resources
- **Status**: [x] COMPLETED
- **File**: `apps/wxt-extension/wxt.config.ts`
- **Change**: Add `use_dynamic_url: true` to web_accessible_resources
- **Impact**: Regenerates extension ID per browser session, preventing static ID fingerprinting

### Phase 2: Medium Priority

#### 2.1 Inline SVG Sprites as Data URIs
- **Status**: [ ] PENDING
- **Files**:
  - `apps/wxt-extension/entrypoints/linkedin.content/engage-button/EngageButton.tsx`
  - `apps/wxt-extension/public/engagekit-sprite-*.svg`
- **Change**: Convert SVG files to base64 data URIs, embed directly in code
- **Impact**: Removes 4 detectable web-accessible resources

#### 2.2 Inline Fonts as Base64
- **Status**: [ ] PENDING
- **Files**:
  - `apps/wxt-extension/assets/fonts-loader.ts`
  - `apps/wxt-extension/public/fonts/*`
- **Change**: Convert WOFF2 fonts to base64, embed in CSS
- **Impact**: Removes font files from web-accessible resources
- **Tradeoff**: Increases initial CSS size (~200-400KB)

#### 2.3 Obfuscate Element IDs and Shadow Root Names
- **Status**: [ ] PENDING
- **Files**:
  - `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`
  - `apps/wxt-extension/entrypoints/linkedin.content/engage-button/ButtonPortalManager.tsx`
- **Current detectable patterns**:
  - `id="engagekit-root"`
  - `name: "engagekit-sidebar"`
- **Change**: Use randomized/session-unique identifiers
- **Example**:
  ```typescript
  const randomId = `_${Math.random().toString(36).slice(2, 10)}`;
  app.id = randomId;
  ```

### Phase 3: Low Priority

#### 3.1 Strip Console Logs in Production
- **Status**: [ ] PENDING (NOT IMPLEMENTING NOW)
- **Files**: Multiple files with `console.log("EngageKit WXT: ...")`
- **Change**: Use build-time stripping or conditional logging
- **Note**: Keep for now for debugging purposes. Consider implementing when moving to production release.
- **Example**:
  ```typescript
  if (import.meta.env.DEV) {
    console.log("EngageKit WXT: LinkedIn content script loaded");
  }
  ```

#### 3.2 Obfuscate CSS Class Names
- **Status**: [ ] PENDING
- **Change**: Use CSS Modules or hashed class names in production
- **Complexity**: High - requires build pipeline changes
- **Note**: Lower priority since shadow DOM already isolates styles

#### 3.3 Randomize Injection Timing
- **Status**: [ ] PENDING
- **File**: `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`
- **Change**: Add small random delay before UI injection
- **Example**:
  ```typescript
  await new Promise(r => setTimeout(r, Math.random() * 1000 + 200));
  ```
- **Note**: May affect user experience, evaluate tradeoff

### Phase 4: Advanced (Future)

#### 4.1 Remove Web Accessible Resources Entirely
- **Status**: [ ] FUTURE
- **Goal**: Zero web-accessible resources = undetectable via WAR probing
- **Requires**: All assets inlined or loaded via background worker

#### 4.2 Prevent Resource Timing Attacks
- **Status**: [ ] FUTURE
- **Research needed**: Even with dynamic URLs, timing differences can reveal extension presence

## Testing

After each change, verify:
1. Extension still functions correctly on LinkedIn
2. Test with [BrowserLeaks Extension Detection](https://browserleaks.com/chrome)
3. Check Chrome DevTools for any `chrome-extension://` URLs in Network tab

## Resources

- [Chrome web_accessible_resources docs](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources)
- [MDN web_accessible_resources](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources)
- [BrowserLeaks - Chrome Extension Detection](https://browserleaks.com/chrome)
- [Extension Fingerprinting Research](https://github.com/AugurProject/extension-fingerprints)
