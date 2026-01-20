# Chrome Store Listing - WXT Extension Update

This document contains the new Chrome Store listing copy for the updated EngageKit extension (wxt-extension), which replaces the old chrome-extension.

---

## Title (from package)

```
EngageKit
```

---

## Summary (Short description - 132 char max)

```
Engage authentically on LinkedIn - AI-assisted commenting with human review, 3 draft options, and zero AI slop
```

---

## Description

```
LinkedIn engagement that feels real, because it is.

EngageKit helps you build genuine connections on LinkedIn by keeping YOU in control of every comment. No autopilot. No bot behavior. Just faster, smarter engagement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW IT WORKS

1. See a post you want to engage with
2. Click "Engage" or press Spacebar
3. Review 3 AI-generated drafts (or write your own)
4. Edit, personalize, and approve
5. Post with confidence

Every comment goes through you first. Period.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY FEATURES

✓ Human-in-the-Loop
Every comment requires your review before posting. You approve, edit, or rewrite - nothing posts automatically.

✓ 3 AI Draft Options
Get three unique comment variations to choose from. Pick the best fit, combine ideas, or use them as inspiration.

✓ 100% Manual Mode
Prefer to write everything yourself? Skip AI entirely and use EngageKit just for workflow efficiency.

✓ Save & Track Authors
Build lists of people you want to engage with. Track who you've commented on and when.

✓ Smart Filtering
Target specific audiences: filter by connection level, skip promoted posts, focus on recent content only.

✓ Analytics Dashboard
See your engagement metrics, profile views, and what's actually working.

✓ Seamless Sidebar
Works directly in your LinkedIn feed. No popup windows, no tab switching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHO THIS IS FOR

• Founders building in public
• Sales professionals doing social selling
• Creators growing their personal brand
• Anyone tired of generic AI comments flooding LinkedIn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY NOT JUST USE A BOT?

Because people can tell. And so can LinkedIn.

AI-generated spam is everywhere now. The comments that stand out are the ones with actual thought behind them. EngageKit helps you engage faster while keeping your voice authentic.

We believe the future of LinkedIn engagement is AI-assisted, not AI-replaced.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT ENGAGEKIT IS NOT

✗ Not an auto-commenter
✗ Not a "set and forget" bot
✗ Not going to spam on your behalf
✗ Not going to post without your approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Get started free. Your LinkedIn presence deserves better than AI slop.
```

**Character count: ~1,850 characters** (within 16,000 limit)

---

## Privacy Page Updates

### Single Purpose Description

```
AI-assisted LinkedIn commenting tool with human review - generates comment drafts for users to edit and approve before posting
```

---

### Permission Justifications

#### activeTab justification

```
**Purpose**: Required for the sidebar to detect when users are on LinkedIn and enable engagement features.

**Usage**:
- Detects LinkedIn pages to show/hide the engagement sidebar
- Enables the "Engage" button and spacebar shortcut on LinkedIn feed posts
- Verifies page context before allowing comment composition

**Code Reference**: Used in content scripts to determine if sidebar should be active and engagement features enabled.
```

#### tabs justification

```
**Purpose**: Required for authentication flow and cross-tab state synchronization.

**Usage**:
- Opens authentication tabs to engagekit.io for secure sign-in/sign-out
- Syncs engagement state across multiple LinkedIn tabs
- Manages sidebar visibility state when switching between tabs

**Code Reference**:
- chrome.tabs.create() for authentication flows
- chrome.tabs.query() for state synchronization across LinkedIn tabs
```

#### storage justification

```
**Purpose**: Stores user preferences, saved author lists, and comment queue state locally.

**Usage**:
- User settings (AI tone, filter preferences, auto-submit toggles)
- Saved author lists for targeted engagement
- Comment queue progress and state
- Recent engagement history

**Code Reference**: Zustand stores persist settings via chrome.storage.local for seamless experience across sessions.
```

#### cookies justification

```
**Purpose**: Maintains synchronized authentication between extension and engagekit.io website.

**Usage**:
- Single sign-on between website and extension
- Session persistence across browser restarts
- Prevents duplicate authentication prompts

**Code Reference**: Authentication service syncs login state with main application domain.
```

#### alarms justification

```
**Purpose**: Maintains authentication session and periodic state refresh.

**Usage**:
- Periodic authentication token validation (prevents unexpected logout)
- Background session refresh during active engagement sessions
- Settings sync with cloud backup

**Code Reference**: Background script uses chrome.alarms for 55-second auth refresh intervals.
```

#### webRequest justification

```
**Purpose**: Required to capture LinkedIn authentication headers for secure API communication.

**Usage**:
- Intercepts LinkedIn's realtime/connect requests to capture authentication tokens
- Extracts cookies, CSRF tokens, and tracking headers needed for LinkedIn API calls
- Enables the extension to make authenticated requests to LinkedIn on behalf of the user
- Only monitors requests to https://*.linkedin.com/realtime/connect* - no other URLs

**Code Reference**: Background script uses chrome.webRequest.onBeforeSendHeaders.addListener() to capture authentication headers from LinkedIn's WebSocket connection requests. These headers are stored locally and used for subsequent API calls to post comments.

**Security Note**: This permission is scoped only to LinkedIn domains. No data is intercepted from other websites. Captured tokens are stored locally and used solely for LinkedIn engagement functionality.
```

#### Host permission justification

```
### https://*.linkedin.com/*

**Purpose**: Primary engagement domain where users compose and submit comments.

**Usage**: Content scripts inject sidebar interface to:
- Display engagement sidebar with comment composition
- Detect posts in LinkedIn feed for engagement
- Extract post content for AI draft generation
- Submit approved comments through LinkedIn's interface

### Service & Authentication Domains

**Domains**:
- https://engagekit.io/* - Main application and API
- https://accounts.engagekit.io/* - Account management
- https://clerk.engagekit.io/* - Authentication service
- https://*.clerk.accounts.dev/* - Authentication provider
- https://*.clerk.dev/* - Authentication provider

**Purpose**: Backend services for AI comment generation, user authentication, and settings synchronization. All communication is encrypted and user-initiated.
```

---

## Data Usage Disclosures

For the new extension, update data collection to reflect:

| Data Type | Collected? | Notes |
|-----------|------------|-------|
| Personally identifiable information | Yes | Email for authentication |
| Authentication information | Yes | Clerk auth tokens |
| User activity | Review | Check if engagement metrics are tracked server-side |
| Website content | Yes | Reads LinkedIn post content for AI generation |

---

## Key Messaging Changes Summary

| Old Copy | New Copy |
|----------|----------|
| "Automatically comment" | "AI-assisted commenting with human review" |
| "Autopilot" | "Human-in-the-loop" |
| "100+ AI Comments Daily" | "3 AI draft options to choose from" |
| "Undetectable" | "Authentic" |
| "Set and forget" | "Every comment goes through you first" |
| "Bot" | "AI-assisted, not AI-replaced" |

---

## Extension Comparison Reference

### Philosophy & Approach

| Aspect | Old Extension | New Extension |
|--------|---------------|---------------|
| Philosophy | Automated bulk commenting with AI | Authentic engagement with human involvement |
| Approach | Bot-like, process-driven automation | Human-centric with AI assistance |
| User Control | Hands-off operation | Human-in-the-loop at every step |
| Workflow | Start → Scroll → Load → Comment → Stop | View Post → Engage → Review Drafts → Edit → Submit |

### Feature Comparison

| Feature | Old Extension | New Extension |
|---------|---------------|---------------|
| Comment Generation | Full AI automation | AI-assisted + manual mode |
| Human-Only Mode | Not available | Yes - 100% Manual Mode |
| Comment Preview | No preview before posting | Full post preview with comments |
| Comment Editing | Automatic, no editing | Required - edit before submit |
| UI Pattern | Popup window | Right-side sidebar with tabs |
| Batch Processing | Yes - multiple posts at once | Single post focus with queue |
| Profile Saving | Not implemented | Yes - Save Authors to Lists |
| Analytics Dashboard | Basic stats only | Full analytics: views, engagement, metrics |

### Target Audience

**Old Extension**: Volume-focused users, "set and forget" preference, bulk LinkedIn activities

**New Extension**: Quality-over-quantity users, brand-conscious professionals, those wanting authentic engagement, serious LinkedIn personal branding
