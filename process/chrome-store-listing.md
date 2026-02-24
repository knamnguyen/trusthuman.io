# Chrome Web Store Listing - TrustHuman Extension

This document contains all the information needed to submit TrustHuman to the Chrome Web Store.

---

## Basic Information

### Extension Name
```
TrustHuman
```

### Summary (Short description - 132 char max)
```
Verify you're human when commenting on LinkedIn, X, and Facebook. Quick selfie verification. Privacy-first.
```

**Character count: 106 characters**

---

## Detailed Description

```
TrustHuman proves you're a real human when you engage on social media.

In the age of AI bots and fake accounts, TrustHuman helps you stand out as a verified human. Get your unique Human # badge and show the world your engagement is authentic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW IT WORKS

1. Install the extension
2. Comment on LinkedIn, X, or Facebook as normal
3. When you submit a comment, Triss (our mascot) asks for a quick selfie
4. Our AI confirms you're human (photo deleted instantly)
5. Your comment is verified and you earn your Human # badge

That's it! No interruption to your workflow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY FEATURES

✓ Multi-Platform Support
Works on LinkedIn, X (Twitter), and Facebook. Verify your humanity across all major social networks.

✓ Quick Selfie Verification
Takes just 2 seconds. Snap a photo, AI confirms you're human, photo is deleted immediately.

✓ Privacy-First
Your photos are NEVER stored. Deleted instantly after face detection. We only store your verification count and streak.

✓ Human # Badge
Get your unique Human number (e.g., Human #42). The earlier you join, the lower your number!

✓ Public Profile
Your profile at trusthuman.io/username shows your verification stats, streak, and activity history.

✓ Leaderboard
Compete with other verified humans. Build your streak and climb the rankings.

✓ Streak Tracking
Verify daily to build your streak. How long can you keep it going?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY TRUSTHUMAN?

Social media is flooded with bots, AI-generated comments, and fake accounts. How do you know if you're talking to a real person?

TrustHuman solves this by requiring a quick human verification for each comment. When you see a TrustHuman badge, you KNOW that person is real.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIVACY & SECURITY

• Photos are deleted IMMEDIATELY after verification
• We never store your photos or biometric data
• We only store: username, verification count, streak, comment metadata
• No tracking, no ads, no data selling
• Open about what we collect - see our privacy policy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHO IS THIS FOR?

• Anyone who wants to prove they're not a bot
• Professionals building trust on LinkedIn
• Content creators engaging authentically
• Anyone tired of bot interactions on social media

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Get your Human # today and join the verified human community!
```

**Character count: ~2,100 characters** (within 16,000 limit)

---

## Category

```
Productivity
```

Alternative: `Social & Communication`

---

## Language

```
English
```

---

## Privacy Policy URL

```
https://trusthuman.io/privacy-policy
```

---

## Screenshots (Required: 1-5 screenshots)

**Dimensions**: 1280x800 or 640x400 pixels

### Screenshot 1: Extension Sidebar on LinkedIn
- Show the TrustHuman sidebar open on LinkedIn
- User is about to submit a comment
- Triss mascot visible

### Screenshot 2: Verification Flow
- Show the verification popup/toast
- Camera preview visible
- "Verify" button prominent

### Screenshot 3: Verification Success
- Show the success state after verification
- Green checkmark or celebration animation
- Badge earned notification

### Screenshot 4: Profile Page
- Show trusthuman.io/username profile
- Display stats: Human #, Verified Actions, Streak
- Activity heatmap visible

### Screenshot 5: Leaderboard (Optional)
- Show the leaderboard page
- Top verified humans listed

---

## Promotional Images (Optional)

### Small Promo Tile: 440x280
- TrustHuman logo
- Tagline: "Prove You're Human"

### Large Promo Tile: 920x680
- Full branding with platforms (LinkedIn, X, Facebook icons)
- Human # badge example

### Marquee: 1400x560
- Wide banner with key features
- "Be a real human on social media"

---

## Single Purpose Description

**Question**: Describe what your extension does in a single sentence.

```
TrustHuman verifies users are human when they comment on LinkedIn, X, and Facebook by requiring a quick selfie verification before each comment is submitted.
```

---

## Permission Justifications (Copy-Paste Ready)

### activeTab
```
Required to detect comment submissions on LinkedIn, X, and Facebook. The extension monitors when users submit comments to trigger the human verification flow. It injects a small verification UI into the page. Only activates on supported social media platforms when the user is actively engaging with comments.
```

### offscreen
```
Required for camera access during selfie verification. Creates an offscreen document to capture webcam images without blocking the main page. Camera is only accessed when user explicitly clicks "Verify". Images are sent to our server for face detection, then immediately deleted. No photos are ever stored.
```

### storage
```
Stores user preferences and extension state locally. Used for: authentication tokens (from Clerk), extension settings, cached verification state, and recently verified comment IDs to prevent duplicate prompts. All data stored locally on user's device. No personal data synced externally except for authentication.
```

### alarms
```
Maintains authentication session with periodic token refresh. Used for: authentication token validation (prevents unexpected logout), background session refresh during active use, and scheduled cleanup of cached data. Alarms run at reasonable intervals (every 55 seconds for auth) and do not run when browser is closed.
```

### tabs
```
Required for authentication flow and cross-tab state sync. Used to: open authentication tabs to trusthuman.io for secure sign-in/sign-out, sync verification state across multiple social media tabs, and manage sidebar visibility when switching tabs. Does not read content from other tabs.
```

### cookies
```
Maintains synchronized authentication between extension and trusthuman.io website. Enables single sign-on between website and extension, session persistence across browser restarts, and prevents duplicate authentication prompts. Cookies only accessed for trusthuman.io domain for authentication purposes.
```

### Host permission (combined)
```
Host permissions for LinkedIn, X/Twitter, Facebook: Core platforms where users verify comments. Content scripts inject verification UI, detect comment submission, and trigger verification flow.

Host permissions for trusthuman.io: Main application domain for user authentication via Clerk, API calls to verify comments and update profiles, all communication encrypted over HTTPS.

Host permissions for clerk.accounts.dev/clerk.dev: Third-party authentication provider (Clerk) for secure user authentication and OAuth flows.
```

---

## Host Permission Justifications (Detailed)

### https://*.linkedin.com/*

```
Purpose: Primary platform where users verify their comments.

Usage:
- Content script injects verification UI
- Detects when user submits a comment
- Triggers verification flow
- Displays TrustHuman badges on verified comments

This is one of the three core platforms supported by the extension.
```

### https://x.com/* and https://twitter.com/*

```
Purpose: Platform where users verify their comments (X/Twitter).

Usage:
- Content script injects verification UI
- Detects when user submits a reply/comment
- Triggers verification flow
- Displays TrustHuman badges on verified comments

Both x.com and twitter.com are included for compatibility.
```

### https://*.facebook.com/*

```
Purpose: Platform where users verify their comments (Facebook).

Usage:
- Content script injects verification UI
- Detects when user submits a comment
- Triggers verification flow
- Displays TrustHuman badges on verified comments

This is one of the three core platforms supported by the extension.
```

### https://trusthuman.io/* and https://*.trusthuman.io/*

```
Purpose: Main application domain for authentication and API.

Usage:
- User authentication via Clerk
- API calls to verify comments and update profile
- Profile page access (trusthuman.io/username)
- Webhook endpoints for verification results

All API communication is encrypted over HTTPS.
```

### https://*.clerk.accounts.dev/* and https://*.clerk.dev/*

```
Purpose: Authentication provider (Clerk) domains.

Usage:
- Secure user authentication
- OAuth flows for sign-in
- Session management

Clerk is a third-party authentication provider used for secure user management.
```

### http://localhost/*

```
Purpose: Development only - allows testing against local development server.

Note: This permission is only used during development and does not affect production users. Consider removing before production submission if not needed for debugging.
```

---

## Data Usage Disclosures

### What data does your extension collect?

| Data Type | Collected? | Reason |
|-----------|------------|--------|
| Personally identifiable information | Yes | Email address for authentication (via Clerk) |
| Health information | No | - |
| Financial and payment information | No | - |
| Authentication information | Yes | Auth tokens for secure sign-in |
| Personal communications | No | - |
| Location | No | - |
| Web history | No | - |
| User activity | Yes | Comment verification counts, streaks, timestamps |
| Website content | Yes | Detects comment submission on supported platforms |

### How is this data used?

```
- Email: User authentication and account management only
- Auth tokens: Secure session management, never shared
- User activity: Displayed on public profile (trusthuman.io/username), leaderboard
- Website content: Only used to detect comment submission, not stored or analyzed
```

### Data retention

```
- Photos: Deleted immediately after face detection (never stored)
- Comment metadata: Stored indefinitely for profile/leaderboard
- Auth tokens: Stored locally, refreshed periodically
- User can delete account and all data via trusthuman.io settings
```

---

## Remote Code Policy

**Question**: Does your extension use remote code?

```
No. All extension code is bundled and included in the extension package. The extension does not download or execute remote code.

The extension does make API calls to trusthuman.io for:
- User authentication
- Verification submission
- Profile data retrieval

These are data APIs only, not code execution.
```

---

## Why does your extension need camera access?

```
TrustHuman requires camera access to verify that the user is a real human (not a bot) through a quick selfie verification.

How it works:
1. User clicks "Verify" after submitting a comment
2. Extension requests camera permission (one-time browser prompt)
3. User takes a quick selfie
4. Image is sent to our server for face detection
5. Server confirms a human face is present
6. Image is IMMEDIATELY DELETED - never stored
7. User's comment is marked as verified

Privacy safeguards:
- Camera is ONLY accessed when user explicitly clicks "Verify"
- Photos are processed and deleted within seconds
- No biometric data is stored
- No facial recognition or identification - only face detection
- User can revoke camera permission at any time via browser settings

This verification prevents bots from flooding social media with fake engagement and helps build trust in online communities.
```

---

## Manifest V3 Compliance

The extension uses Manifest V3 and complies with all Chrome Web Store policies:

- ✅ No remote code execution
- ✅ Service worker instead of background page
- ✅ Content scripts clearly defined
- ✅ Permissions are minimal and justified
- ✅ Privacy policy provided
- ✅ Clear single purpose

---

## Review Notes for Chrome Team

```
TrustHuman is a human verification tool for social media engagement. Key points for review:

1. CAMERA ACCESS: Used only for selfie verification. Photos are immediately deleted after face detection. No storage, no facial recognition.

2. SOCIAL MEDIA INTEGRATION: We inject a small verification UI on LinkedIn, X, and Facebook. We do not modify user content or automate posting.

3. OFFSCREEN DOCUMENT: Used to capture camera images without blocking the page. Required for smooth UX during verification.

4. AUTHENTICATION: We use Clerk (clerk.dev) for secure authentication. Standard OAuth flow.

5. PRIVACY: We take privacy seriously. Photos are never stored. Only verification metadata (count, timestamp) is retained.

Happy to provide any additional information needed for review.
```

---

## Post-Submission Checklist

- [ ] Note the submission date
- [ ] Monitor email for review status
- [ ] Respond promptly to any reviewer questions
- [ ] After approval:
  - [ ] Note Chrome Web Store URL
  - [ ] Update `ASSETS.chromeWebStoreUrl` in landing-content.ts
  - [ ] Update landing page "Install Extension" buttons
  - [ ] Announce launch!

---

## Extension ID

After building and loading the extension in Chrome:

**Extension ID**: `_____________________________`

(Fill in after loading dist/ in chrome://extensions)

This ID must be added to Clerk "Allowed Origins" before submission.
