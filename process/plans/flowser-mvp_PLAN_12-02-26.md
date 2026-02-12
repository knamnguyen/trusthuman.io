# Flowser MVP - Implementation Plan (Revised)

**Date:** 12-02-26
**Type:** SIMPLE (one-session)

---

## What Is Flowser?

An MCP server that gives Claude (or OpenClaw) the ability to **control LinkedIn in your browser**. You ask Claude to read your feed, like posts, or leave comments — and it actually does it in your real, already-logged-in Chrome.

---

## Where Does The Code Live?

```
apps/flowser/              ← NEW app in the monorepo (standalone MCP server)
├── package.json           # Dependencies + scripts
├── tsconfig.json          # TypeScript config
├── README.md              # How to set up and test
└── src/
    ├── index.ts           # Entry: starts MCP server with stdio transport
    ├── server.ts          # Registers 3 MCP tools
    ├── browser.ts         # Connects to Chrome via CDP, injects scripts
    └── workflows/
        ├── read-feed-posts.ts    # Tool: scroll feed, return post data
        ├── like-post.ts          # Tool: like a post by URN
        └── comment-on-post.ts    # Tool: submit a comment on a post
```

**Why `apps/` not `packages/`?** Flowser is a standalone runnable server (like `apps/nextjs`), not a shared library that other packages import from. It imports from `@sassy/linkedin-automation`, not the other way around.

It imports from `@sassy/linkedin-automation` (existing DOM scripts, zero duplication).

---

## How It Works

```
Your Chrome (logged into LinkedIn)
    │
    │  CDP connection (ws://127.0.0.1:9222)
    ▼
┌─────────────────────────────────────┐
│      Flowser MCP Server             │
│  (apps/flowser)                 │
│                                     │
│  On startup:                        │
│  1. Connect to Chrome via CDP       │
│  2. Bundle linkedin-automation      │
│     scripts with Bun.build()        │
│  3. Inject into browser page via    │
│     page.evaluateOnNewDocument()    │
│                                     │
│  Tools:                             │
│  ├── read_feed_posts(count)         │
│  │   → scrolls feed, returns data   │
│  ├── like_post(postUrn)             │
│  │   → clicks like button           │
│  └── comment_on_post(postUrn, text) │
│      → types and submits comment    │
└──────────────┬──────────────────────┘
               │
               │  page.evaluate()
               ▼
┌─────────────────────────────────────┐
│  window.engagekitInternals          │
│  (injected DOM scripts)             │
│  - collectPostsBatch()              │
│  - navigateToPostAndSubmitComment() │
│  - likePost()                       │
└─────────────────────────────────────┘
```

---

## The 3 Tools (What Claude Can Do)

### Tool 1: `read_feed_posts`
**What it does:** Scrolls your LinkedIn feed and collects post data.
**Input:** `{ count: 5 }` — how many posts to read
**Output:** Array of posts with URN, caption, author name, headline, comments
**Prerequisite:** Browser must be on linkedin.com/feed

Example Claude usage:
> "Read my LinkedIn feed and summarize the top 5 posts"

### Tool 2: `like_post`
**What it does:** Navigates to a post and clicks the Like button.
**Input:** `{ postUrn: "urn:li:activity:123" }` — from read_feed_posts output
**Output:** `{ success: true }` or `{ success: false, alreadyLiked: true }`
**Prerequisite:** Valid postUrn from a previous read_feed_posts call

Example Claude usage:
> "Like all the posts about AI from my feed"

### Tool 3: `comment_on_post`
**What it does:** Navigates to a post, types a comment, and submits it.
**Input:** `{ postUrn: "urn:li:activity:123", comment: "Great post!" }`
**Output:** `{ success: true }` or `{ success: false, reason: "..." }`
**Prerequisite:** Valid postUrn + comment text (Claude generates this)

Example Claude usage:
> "Leave a thoughtful comment on each post in my feed"

### How Claude Chains These Together

Claude is already an agent — it naturally chains tool calls:

```
User: "Read my feed, summarize the posts, like the AI ones,
       and leave a thoughtful comment on each"

Claude:
  1. Calls read_feed_posts({ count: 10 })
     → Gets back 10 posts with URNs, captions, authors

  2. Reads the data, summarizes each post for the user

  3. Identifies which posts are about AI (posts 1, 4, 7)

  4. Calls like_post({ postUrn: "urn:li:activity:111" })  ← post 1
     Calls like_post({ postUrn: "urn:li:activity:444" })  ← post 4
     Calls like_post({ postUrn: "urn:li:activity:777" })  ← post 7

  5. Generates thoughtful comments based on each post's caption

  6. Calls comment_on_post({ postUrn: "urn:li:activity:111",
       comment: "Really insightful take on..." })
     (repeats for posts 4 and 7)

  7. Reports back: "Done! I liked 3 AI posts and left comments."
```

The **postUrn** is the key that flows between tools. `read_feed_posts` returns it, and the other tools accept it.

---

## Testing: Step-by-Step Setup Guide

### Step 1: Start Chrome with debugging enabled

Close ALL Chrome windows first, then:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**This opens your normal Chrome with all your saved logins.** LinkedIn should already be logged in. If not, just log in normally.

### Step 2: Verify Chrome is accessible

In another terminal:
```bash
curl http://127.0.0.1:9222/json/version
```

You should see JSON with Chrome version info. This confirms CDP is working.

### Step 3: Build Flowser

```bash
cd apps/flowser
pnpm install
pnpm build
```

### Step 4: Add Flowser to Claude Code

```bash
claude mcp add flowser -- bun run /path/to/apps/flowser/src/index.ts --cdp ws://127.0.0.1:9222
```

### Step 5: Test with Claude Code

Open a new Claude Code conversation and try:

1. **Basic test:** "What LinkedIn tools do you have available?"
   → Claude should list the 3 Flowser tools

2. **Read test:** "Read the top 5 posts from my LinkedIn feed"
   → Watch Chrome navigate to feed and scroll
   → Claude returns post summaries

3. **Like test:** "Like the first post"
   → Watch the like button click in Chrome
   → Claude confirms success

4. **Comment test (careful!):** "Leave a comment saying 'Great insights!' on the second post"
   → Watch the comment get typed and submitted
   → Claude confirms success

### Alternative: OpenClaw Testing

If you have OpenClaw installed:

**With Extension Relay (your existing Chrome):**
```json
// mcporter config
{
  "servers": {
    "flowser": {
      "command": "bun",
      "args": ["run", "apps/flowser/src/index.ts", "--cdp", "ws://127.0.0.1:18792"]
    }
  }
}
```

**With Managed Browser (separate profile, need to log in):**
```json
{
  "servers": {
    "flowser": {
      "command": "bun",
      "args": ["run", "apps/flowser/src/index.ts", "--cdp", "ws://127.0.0.1:18800"]
    }
  }
}
```

---

## Implementation Steps

### Phase 1: Project Setup
- [ ] Create `apps/flowser/` directory structure
- [ ] Create `package.json` with deps: `@modelcontextprotocol/sdk`, `zod`, `playwright`
- [ ] Create `tsconfig.json` extending monorepo config
- [ ] Add to `pnpm-workspace.yaml` if needed
- [ ] Run `pnpm install`

### Phase 2: Browser Connection (`src/browser.ts`)
- [ ] Connect to Chrome via CDP using Playwright's `chromium.connectOverCDP()`
- [ ] Get the active page (or first LinkedIn tab)
- [ ] Bundle `@sassy/linkedin-automation` scripts using `Bun.build()` (same pattern as `browser-session.ts`)
- [ ] Inject bundle into page via `page.evaluate()`
- [ ] Expose `window.engagekitInternals` in the browser
- [ ] Export helper: `getPage()` for workflows to use

### Phase 3: Workflow Implementations (`src/workflows/`)
- [ ] `read-feed-posts.ts`: Call `page.evaluate(() => window.engagekitInternals.collectPostsBatch(...))`
  - Navigate to feed if not already there
  - Return serialized post data (no HTMLElement refs — just plain objects)
- [ ] `like-post.ts`: Navigate to post, find container, call likePost()
- [ ] `comment-on-post.ts`: Call `navigateToPostAndSubmitComment()` via page.evaluate()

### Phase 4: MCP Server (`src/server.ts` + `src/index.ts`)
- [ ] Create McpServer with `registerTool()` for each workflow
- [ ] Parse `--cdp` flag from process args
- [ ] Connect to browser on startup
- [ ] Set up stdio transport
- [ ] Handle graceful shutdown (close browser connection)

### Phase 5: Test & Verify
- [ ] Start Chrome with `--remote-debugging-port=9222`
- [ ] Run `bun run src/index.ts --cdp ws://127.0.0.1:9222` manually to verify startup
- [ ] Add to Claude Code with `claude mcp add`
- [ ] Test each tool in Claude Code conversation
- [ ] Verify actions happen in browser

### Phase 6: README
- [ ] Write setup instructions (copy-pasteable commands)
- [ ] Add OpenClaw configuration examples
- [ ] Document each tool with examples

---

## Dependencies

```json
{
  "name": "@sassy/flowser",
  "private": true,
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "playwright": "latest",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.0.0"
  }
}
```

Plus workspace reference to `@sassy/linkedin-automation`.

---

## What's NOT In This MVP

- ❌ Authentication / login handling (browser already logged in)
- ❌ OpenClaw skill packaging (just an MCP server for now)
- ❌ Database integration
- ❌ More than 3 tools
- ❌ Error retry logic
- ❌ Dry run mode (can add later)
- ❌ Headless mode

---

## Success = This Conversation Works

```
You: "Read my LinkedIn feed, summarize the top 5 posts,
      and like the ones about AI"

Claude: I'll start by reading your feed.
        [calls read_feed_posts({ count: 5 })]

        Here's what's on your feed:
        1. John Doe: "AI is transforming the way we build..."
        2. Jane Smith: "5 marketing tips for startups..."
        3. Sam Wilson: "New breakthrough in LLMs..."
        4. Lisa Chen: "How to negotiate your salary..."
        5. Mike Brown: "The future of AI agents..."

        Posts 1, 3, and 5 are about AI. Let me like those.
        [calls like_post for each]

        Done! I liked 3 posts about AI for you.
```
