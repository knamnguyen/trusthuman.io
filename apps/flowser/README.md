# Flowser — LinkedIn MCP Server

An MCP server that gives Claude (or any MCP client) the ability to control LinkedIn in your browser. You ask Claude to read your feed, like posts, or leave comments — and it does it in your real, already-logged-in Chrome.

## Quick Start

### 1. Start Chrome with debugging enabled

Close ALL Chrome windows first, then:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome-Debug" \
  --no-first-run
```

**Note:** Chrome requires a non-default `--user-data-dir` for remote debugging. The first time, copy your profile to keep your LinkedIn login:

```bash
cp -r ~/Library/Application\ Support/Google/Chrome/Default \
      ~/Library/Application\ Support/Google/Chrome-Debug/Default
```

Then launch Chrome and navigate to linkedin.com to verify you're logged in.

### 2. Verify Chrome is accessible

```bash
curl http://127.0.0.1:9222/json/version
```

You should see JSON with Chrome version info.

### 3. Add Flowser to Claude Code

```bash
claude mcp add flowser -- bun run /path/to/apps/flowser/src/index.ts --cdp ws://127.0.0.1:9222
```

Replace `/path/to` with the actual absolute path to the monorepo.

### 4. Test with Claude Code

Open a new Claude Code conversation:

1. **"What LinkedIn tools do you have?"** — Claude lists the 3 Flowser tools
2. **"Read the top 5 posts from my LinkedIn feed"** — Watch Chrome scroll the feed
3. **"Like the first post"** — Watch the like button click
4. **"Leave a comment saying 'Great insights!' on the second post"** — Watch the comment get typed and submitted

## Tools

### `read_feed_posts`

Scrolls your LinkedIn feed and collects post data.

- **Input:** `{ count: 5 }`
- **Output:** Array of posts with URN, caption, author name, headline, comments
- **Prereq:** Browser must have a tab open (will navigate to feed if needed)

### `like_post`

Navigates to a post and clicks the Like button.

- **Input:** `{ postUrn: "urn:li:activity:123" }` (from read_feed_posts output)
- **Output:** `{ success: true }` or `{ success: false, alreadyLiked: true }`

### `comment_on_post`

Navigates to a post, types a comment, and submits it.

- **Input:** `{ postUrn: "urn:li:activity:123", comment: "Great post!" }`
- **Output:** `{ ok: true }` or `{ ok: false, reason: "..." }`

## How Claude Chains These

```
You: "Read my feed, summarize the posts, like the AI ones,
      and leave a thoughtful comment on each"

Claude:
  1. Calls read_feed_posts({ count: 10 })
  2. Summarizes each post
  3. Identifies AI-related posts
  4. Calls like_post for each
  5. Generates and submits comments via comment_on_post
  6. Reports back: "Done! I liked 3 AI posts and left comments."
```

The `postUrn` flows between tools: `read_feed_posts` returns it, `like_post` and `comment_on_post` accept it.

## OpenClaw Integration

### Extension Relay (your existing browser)

```json
{
  "servers": {
    "flowser": {
      "command": "bun",
      "args": ["run", "apps/flowser/src/index.ts", "--cdp", "ws://127.0.0.1:18792"]
    }
  }
}
```

### Managed Browser (separate profile)

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

## Architecture

```
Chrome (logged into LinkedIn)
    │  CDP connection
    ▼
Flowser MCP Server (apps/flowser)
    │  On startup:
    │  1. Connect via Playwright's chromium.connectOverCDP()
    │  2. Bundle @sassy/linkedin-automation with Bun.build()
    │  3. Inject into page via page.evaluate()
    │
    │  Tools call page.evaluate() → window.engagekitInternals.*
    ▼
window.engagekitInternals (injected DOM scripts)
    - collectPostsBatch()
    - commentUtils.likePost()
    - commentUtils.insertComment() + submitComment()
```
