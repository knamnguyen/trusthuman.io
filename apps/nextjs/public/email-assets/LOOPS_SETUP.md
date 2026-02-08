# Weekly Analytics Email Template - Loops Setup Guide

## Overview

This guide explains how to set up the weekly LinkedIn analytics email template in the Loops dashboard.

## Template Design

- **Layout Inspiration**: Duolingo (encouraging, progress-focused)
- **Visual Style**: Neobrutalist (hard shadows, thick borders, bold colors)
- **Design System**: Uses colors from `packages/ui/src/styles/theme.css`

## Email Structure (Top to Bottom)

1. **Kit Mascot GIF** - Blinking animation
2. **Hero Banner** - Personalized greeting
3. **6 Metric Cards** - 2x3 grid with color-coded icons
4. **7-Day Chart** - Line chart showing all metrics
5. **Encouragement Section** - Meme/GIF with motivational text
6. **CTA Button** - "Earn Premium" link

## Template Variables

The Loops template must include these variables:

### User & URLs
- `{{userName}}` - User's first name (e.g., "Kelly")
- `{{kitGifUrl}}` - URL to Kit mascot GIF (hosted on app)
- `{{chartUrl}}` - QuickChart.io generated chart URL
- `{{memeUrl}}` - Memegen.link meme URL (same for all users weekly)
- `{{ctaUrl}}` - Link to earn-premium page

### Current Metrics (Single Values)
- `{{followers}}` - Total followers count
- `{{invites}}` - Total connection invites sent
- `{{comments}}` - Total comments made
- `{{contentReach}}` - Content impressions
- `{{profileViews}}` - Profile views
- `{{engageReach}}` - Profile impressions from engagement

### Chart Data (NOT used in template, only in backend)
The backend generates the chart URL using 7-day arrays:
- `followersWeek`, `invitesWeek`, `commentsWeek`
- `contentReachWeek`, `profileViewsWeek`, `engageReachWeek`
- `dateLabels` (e.g., ["Feb 1", "Feb 2", ...])

## Setup Steps in Loops Dashboard

### 1. Create New Template

1. Go to Loops dashboard → Templates → Create Template
2. Name: "Weekly LinkedIn Analytics"
3. Template Type: Transactional

### 2. Upload HTML Template

1. Copy contents from `weekly-analytics-template.html`
2. Paste into Loops HTML editor
3. The template uses inline CSS for email client compatibility

### 3. Configure Template Variables

Add these variables in Loops:

**Text Variables:**
- userName (default: "there")

**URL Variables:**
- kitGifUrl (required)
- chartUrl (required)
- memeUrl (required)
- ctaUrl (required)

**Number Variables:**
- followers (default: 0)
- invites (default: 0)
- comments (default: 0)
- contentReach (default: 0)
- profileViews (default: 0)
- engageReach (default: 0)

### 4. Test Preview

1. Click "Preview" in Loops dashboard
2. Add sample data:
   - userName: "Kelly"
   - kitGifUrl: `https://app.engagekit.io/email-assets/kit-sprite-blink.gif`
   - followers: 49
   - invites: 11
   - comments: 8
   - contentReach: 125
   - profileViews: 23
   - engageReach: 89
   - chartUrl: `https://quickchart.io/chart?width=800&height=400&c=%7B%22type%22%3A%22line%22%2C%22data%22%3A%7B%22labels%22%3A%5B%22Feb%201%22%2C%22Feb%202%22%2C%22Feb%203%22%2C%22Feb%204%22%2C%22Feb%205%22%2C%22Feb%206%22%2C%22Feb%207%22%5D%2C%22datasets%22%3A%5B%7B%22label%22%3A%22Followers%22%2C%22data%22%3A%5B43%2C44%2C45%2C46%2C47%2C48%2C49%5D%2C%22borderColor%22%3A%22%231b9aaa%22%2C%22backgroundColor%22%3A%22rgba(27%2C154%2C170%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%2C%7B%22label%22%3A%22Invites%22%2C%22data%22%3A%5B5%2C6%2C8%2C9%2C10%2C11%2C11%5D%2C%22borderColor%22%3A%22%23308169%22%2C%22backgroundColor%22%3A%22rgba(48%2C129%2C105%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%2C%7B%22label%22%3A%22Comments%22%2C%22data%22%3A%5B3%2C4%2C5%2C6%2C7%2C8%2C8%5D%2C%22borderColor%22%3A%22%23ffc63d%22%2C%22backgroundColor%22%3A%22rgba(255%2C198%2C61%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%2C%7B%22label%22%3A%22Content%20Reach%22%2C%22data%22%3A%5B90%2C95%2C100%2C110%2C115%2C120%2C125%5D%2C%22borderColor%22%3A%22%23ed6b67%22%2C%22backgroundColor%22%3A%22rgba(237%2C107%2C103%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Atrue%2C%22anchor%22%3A%22end%22%2C%22align%22%3A%22top%22%2C%22font%22%3A%7B%22size%22%3A24%2C%22weight%22%3A%22bold%22%7D%2C%22color%22%3A%22%23ed6b67%22%7D%7D%2C%7B%22label%22%3A%22Profile%20Views%22%2C%22data%22%3A%5B15%2C16%2C18%2C20%2C21%2C22%2C23%5D%2C%22borderColor%22%3A%22%23e5496d%22%2C%22backgroundColor%22%3A%22rgba(229%2C73%2C109%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%2C%7B%22label%22%3A%22Engage%20Reach%22%2C%22data%22%3A%5B70%2C72%2C75%2C81%2C84%2C86%2C89%5D%2C%22borderColor%22%3A%22%23f9dcec%22%2C%22backgroundColor%22%3A%22rgba(249%2C220%2C236%2C0.1)%22%2C%22borderWidth%22%3A6%2C%22tension%22%3A0.3%2C%22pointRadius%22%3A10%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%5D%7D%2C%22options%22%3A%7B%22plugins%22%3A%7B%22legend%22%3A%7B%22display%22%3Atrue%2C%22position%22%3A%22top%22%2C%22labels%22%3A%7B%22font%22%3A%7B%22size%22%3A360%7D%2C%22padding%22%3A100%2C%22boxWidth%22%3A200%7D%7D%2C%22datalabels%22%3A%7B%22display%22%3Afalse%7D%7D%2C%22scales%22%3A%7B%22y%22%3A%7B%22beginAtZero%22%3Atrue%2C%22ticks%22%3A%7B%22font%22%3A%7B%22size%22%3A300%7D%7D%7D%2C%22x%22%3A%7B%22ticks%22%3A%7B%22font%22%3A%7B%22size%22%3A300%7D%7D%7D%7D%7D%7D`
   - memeUrl: `https://api.memegen.link/images/success/Keep_crushing_it!/Your_consistency_is_paying_off.png`
   - ctaUrl: `https://app.engagekit.io/acme/earn-premium`

### 5. Get Template ID

1. After saving, copy the Template ID from Loops dashboard
2. Update in `packages/api/src/router/analytics.ts`:
   ```typescript
   const LOOPS_TEMPLATE_ID = "your-new-template-id";
   ```

## Color Palette (from theme.css)

### Light Mode (Default)
- Background: `#f6f5ee` (warm cream)
- Card: `#fbf6e5` (light cream)
- Primary: `#e5486c` (vibrant pink)
- Secondary: `#308169` (teal green)
- Border: `#000000` (pure black)
- Shadow: `2px 2px 0px 0px #000000` (neobrutalist hard shadow)

### Chart Colors (Metrics)
1. Followers: `#1b9aaa` (bright teal)
2. Invites: `#308169` (teal green)
3. Comments: `#ffc63d` (golden yellow)
4. Content Reach: `#ed6b67` (coral red)
5. Profile Views: `#e5496d` (vibrant pink)
6. Engage Reach: `#f9dcec` (light pink)

## QuickChart.io Integration

The backend automatically generates chart URLs using QuickChart.io:

```typescript
const chartUrl = generateChartUrl({
  followers: [49, 49, 49, 49, 49, 49, 49],
  invites: [11, 11, 11, 11, 11, 11, 11],
  comments: [8, 8, 8, 8, 8, 8, 8],
  contentReach: [125, 125, 125, 125, 125, 125, 125],
  profileViews: [23, 23, 23, 23, 23, 23, 23],
  engageReach: [89, 89, 89, 89, 89, 89, 89],
  labels: ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7"],
});
```

No API key required - QuickChart.io is free for server-side rendering.

## Meme/GIF Strategy

**Simple Weekly Approach** (Recommended):
- Use **same meme/GIF for all users** in weekly batch
- Only 1-2 API calls per week total (not per user)
- Free tiers are sufficient

**APIs to Use:**
1. **Memegen.link** (Memes)
   - Free, unlimited, open source
   - Format: `https://api.memegen.link/images/<template>/<text_top>/<text_bottom>.png`
   - Special chars: Space → `_`, `%` → `~p`, `?` → `~q`
   - Example: `https://api.memegen.link/images/success/Kelly_crushed_it!/40_percent_growth.png`

2. **Klipy** (GIFs)
   - Lifetime free after production access approval
   - Drop-in Tenor replacement
   - Unlimited usage

## Mobile Responsiveness

The template is mobile-responsive:
- Cards stack vertically on small screens
- Max-width: 600px for desktop
- Font sizes scale appropriately
- Touch-friendly CTA button

## Testing Checklist

Before going live:

- [ ] Upload template to Loops dashboard
- [ ] Configure all template variables
- [ ] Test preview in Loops
- [ ] Send test email via tRPC endpoint
- [ ] Verify email on Gmail desktop
- [ ] Verify email on Outlook desktop
- [ ] Verify email on iOS Mail app
- [ ] Verify email on Gmail mobile app
- [ ] Check all links work correctly
- [ ] Verify GIF animations play
- [ ] Verify chart displays correctly
- [ ] Check mobile layout (cards stack)

## tRPC Test Endpoint

Use this endpoint to send a test email:

```typescript
const result = await trpc.analytics.sendTestAnalyticsEmail.mutate({
  // Current metrics
  followers: 49,
  invites: 11,
  comments: 8,
  contentReach: 125,
  profileViews: 23,
  engageReach: 89,
  // 7-day data
  followersWeek: [49, 49, 49, 49, 49, 49, 49],
  invitesWeek: [11, 11, 11, 11, 11, 11, 11],
  commentsWeek: [8, 8, 8, 8, 8, 8, 8],
  contentReachWeek: [125, 125, 125, 125, 125, 125, 125],
  profileViewsWeek: [23, 23, 23, 23, 23, 23, 23],
  engageReachWeek: [89, 89, 89, 89, 89, 89, 89],
  dateLabels: ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7"],
});
```

## Production Deployment

1. Upload Kit mascot GIF to production CDN
2. Update `NEXT_PUBLIC_APP_URL` environment variable
3. Update Loops template ID in analytics router
4. Set up weekly cron job to send emails
5. Monitor email delivery rates

## Support

For issues or questions:
- Loops Documentation: https://loops.so/docs
- QuickChart.io Docs: https://quickchart.io/documentation
- Memegen.link Docs: https://memegen.link
