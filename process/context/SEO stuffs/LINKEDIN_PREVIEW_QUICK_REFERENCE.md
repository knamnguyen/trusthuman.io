# LinkedIn Preview Tool - Quick Reference for Implementation Team

**One-page guides for different roles**

---

## For Copywriters

### Primary Messaging Triangle
```
          UNIQUE
           /\
          /  \
         / ✓✓✓ \
        /       \
       / SEO      \
      /____________\
    AUTHENTIC    KEYWORD-RICH
```

**Must have all three:**
1. **Unique** - Different from linkedinpreview.com
2. **SEO-Rich** - Keywords naturally woven throughout
3. **Authentic** - True to EngageKit's features

---

### Keyword Density Target

For main sections, aim for:
- Primary keyword (e.g., "LinkedIn post preview") = 2-3 mentions
- Secondary keywords (e.g., "save drafts," "shareable links") = 1-2 mentions per section
- Descriptive keywords = 3-5 mentions naturally woven

**Example for Hero:**
- "LinkedIn post preview" (primary) = 2x
- "save drafts" (secondary) = 1x
- "shareable links" (secondary) = 1x
- "mobile, tablet, desktop" (descriptive) = 1x

---

### Tone Guidelines

**DO:**
- Use active voice ("Save your drafts" vs "Your drafts can be saved")
- Be specific ("See exactly where LinkedIn truncates" vs "See how it looks")
- Address user needs ("Perfect for agencies managing multiple accounts")
- Use power words (Professional, Optimize, Engage, Collaborate, Publish)

**DON'T:**
- Copy linkedinpreview.com phrasing
- Use generic marketing fluff ("Industry-leading," "Revolutionary")
- Make claims about other tools without data
- Oversell features (analytics coming in 2025, not available today)

---

### Unique Phrases to Use

```
✓ "Save drafts and come back later"
✓ "Shareable preview links for team feedback"
✓ "See exactly where 'see more' truncation begins"
✓ "Optimize your hook for mobile-first audience"
✓ "No signup required for core preview features"
✓ "Perfect for content teams, agencies, and professionals"
✓ "A/B test different versions before publishing"
✓ "Professional formatting: bold, italic, emoji, lists"
✓ "Mobile preview shows real rendering accuracy"
✓ "100% free with optional account for save/share"
```

---

### Avoid These Phrases (Duplicate Risk)

```
✗ "Format and Preview your LinkedIn Posts"
✗ "A free tool to Write, Format, and Preview"
✗ "Improve your LinkedIn presence and engagement"
✗ "Make your posts stand out with rich text"
✗ "Check out how your post will look"
✗ "See it before you share it"
✗ "Perfect for professionals and companies"
```

---

## For SEO/Technical Team

### Schema Markup Checklist

- [ ] SoftwareApplication schema with `featureList` array
- [ ] Organization schema for EngageKit branding
- [ ] AggregateRating schema (if testimonials exist)
- [ ] FAQPage schema with 12 Q&A items
- [ ] BreadcrumbList schema for navigation
- [ ] VideoObject schema (if how-to video exists)

### Meta Tags Template

```html
<title>Professional LinkedIn Post Preview Tool - Save, Share & Format Drafts</title>
<meta name="description" content="Free LinkedIn post preview tool with save & share features. Format with bold, italic, emoji. Preview on mobile, tablet & desktop. Shareable links for team feedback. No account required.">
<meta name="keywords" content="LinkedIn post preview, save drafts, shareable links, LinkedIn formatter, format posts">
<link rel="canonical" href="https://blog.engagekit.io/linkedin-post-previewer/">
```

### Image Alt Text Examples

```
❌ "Preview tool"
✅ "LinkedIn post preview showing mobile and desktop rendering comparison"

❌ "Save feature"
✅ "Save LinkedIn post drafts and generate shareable preview links"

❌ "Formatting options"
✅ "LinkedIn text formatting options including bold, italic, emoji, and bullet points"
```

---

## For Product/UX Team

### Feature Emphasis Checklist

As users navigate the tool, make sure to emphasize:

1. **Save Feature**
   - [ ] Prominent "Save Draft" button
   - [ ] Clear CTA to sign in/create account
   - [ ] Show value: "Save unlimited drafts"

2. **Share Feature**
   - [ ] Clear "Generate Shareable Link" button after saving
   - [ ] Show what link looks like to recipients
   - [ ] Emphasize "No signup required for reviewers"

3. **Device Preview**
   - [ ] Prominent device selector (Mobile/Tablet/Desktop)
   - [ ] Show "See More" truncation marker on mobile
   - [ ] Highlight where hook gets cut off

4. **Formatting**
   - [ ] Live preview updates as user types
   - [ ] Clear formatting buttons/options
   - [ ] Show what formatting looks like in real-time

---

### Copy Integration Points

```
POINT 1: Initial Landing
User sees: Hero section + "Get Started" CTA
Content focus: Save + share + mobile preview

POINT 2: Tool UI
User sees: Formatting options, device previews
Content focus: "See exactly how your post looks on mobile"

POINT 3: Save Feature
User sees: Save button, login prompt
Content focus: "Save unlimited drafts, A/B test versions"

POINT 4: Share Feature
User sees: Share button, shareable link
Content focus: "Get instant team feedback"

POINT 5: Footer
User sees: Links to FAQ, blog, help
Content focus: Additional reassurance + credibility
```

---

## For Marketing/Growth Team

### Blog Content Priority

**Must-Create (Q1 2025):**
1. "LinkedIn Post Formatting Best Practices: How to Get 3x More Engagement"
2. "The 'See More' Trap: How to Optimize Your LinkedIn Hook"
3. "LinkedIn Preview Tool for Content Teams: Approval Workflow Guide"

**Should-Create (Q2 2025):**
4. "LinkedIn Post Preview for Agencies: Team Collaboration Guide"
5. "LinkedIn Formatting Accuracy: Unicode, Device Support & Rendering"
6. "Listicle vs Narrative: Which LinkedIn Post Format Wins?"

**Nice-to-Have (Q2/Q3 2025):**
7. "LinkedIn Algorithm Factors: Why Formatting Matters"
8. "How Sales Teams Use LinkedIn Preview for Outreach"
9. "HR Professionals: LinkedIn Preview for Employer Branding"

---

### Internal Linking Strategy

From blog posts, link to tool page with anchor text:
- "LinkedIn post preview tool" → `/linkedin-post-previewer/`
- "save LinkedIn drafts" → `/linkedin-post-previewer/#main-features`
- "shareable preview links" → `/linkedin-post-previewer/#features`
- "mobile preview" → `/linkedin-post-previewer/#all-features`
- "format LinkedIn posts" → `/linkedin-post-previewer/#how-to-use`

---

### Social Media Angles

**Use these to promote the tool:**

1. **Save + Share Angle:**
   "Just dropped a LinkedIn post preview tool with one unique feature: shareable links for team feedback. No more screenshot reviews. 🔗"

2. **Hook Optimization Angle:**
   "85% of LinkedIn users are on mobile. Our preview shows EXACTLY where 'see more' truncation happens. Optimize your hook or lose engagement."

3. **Team Collaboration Angle:**
   "Content teams: Get instant preview links for post approval. No signup needed for reviewers. Launch faster."

4. **Formatting Accuracy Angle:**
   "Our preview shows how bold text, emoji, and lists render on iPhone, Android, iPad, and desktop. Catch formatting issues before publishing."

5. **Free Forever Angle:**
   "LinkedIn preview tool. Save drafts. Share with team. Format posts. All free. No credit card. No upsell. Just useful."

---

## For Analytics Team

### Metrics to Track

**Tool Usage:**
- [ ] Preview count per day/month
- [ ] Save count (account creation rate)
- [ ] Share count (link generation)
- [ ] Account signup rate
- [ ] Devices used for preview

**Content Performance:**
- [ ] Time on page (target: 2-3 minutes)
- [ ] Bounce rate (target: <40%)
- [ ] Scroll depth (target: 70%+ scroll)
- [ ] Internal link click-through rate

**SEO Metrics:**
- [ ] Search impressions for target keywords
- [ ] Average search position
- [ ] Click-through rate from SERPs
- [ ] Keyword ranking changes

**Conversion Funnel:**
- [ ] Landing page → Tool page: X% conversion
- [ ] Tool page → Account signup: X% conversion
- [ ] Account signup → Saved draft: X% conversion
- [ ] Saved draft → Shared link: X% conversion

---

### Dashboard Recommendations

Create dashboard with:
1. **Top 10 Keywords** - Ranking, volume, CTR
2. **Tool Usage Trends** - Daily active users, saves, shares
3. **Content Performance** - Page views, scroll depth, time on page
4. **Funnel Metrics** - Signup rate, save rate, share rate
5. **Traffic Sources** - Organic % of total, by keyword cluster

---

## For Project Manager

### Approval Workflow

```
PHASE 1: Content Overhaul (Weeks 1-2)
├─ Copywriter creates new content
├─ Marketing reviews for brand alignment
├─ Product approves feature descriptions
└─ Approve for implementation

PHASE 2: Technical Setup (Weeks 1-2)
├─ Engineer implements schema markup
├─ SEO validates implementation
├─ QA tests on multiple devices
└─ Approve for deployment

PHASE 3: Blog Content (Weeks 2-4)
├─ Content team writes 3-5 blog posts
├─ Copywriter reviews for keyword alignment
├─ Marketing approves messaging
└─ Engineer integrates internal links

PHASE 4: Launch (Week 5)
├─ Deploy updated content
├─ Submit to Search Console
├─ Monitor for issues
└─ Begin blog content rollout
```

---

### Stakeholder Checklist

Before launching, ensure:
- [ ] Copywriter approval: Messaging is unique & SEO-optimized
- [ ] Marketing approval: Strategy aligns with brand & goals
- [ ] Product approval: Feature descriptions are accurate
- [ ] Engineering approval: Technical implementation is sound
- [ ] Design approval: Layout changes work with new content
- [ ] Legal/Compliance: No misleading claims

---

## For Executive Sponsor

### Business Case Summary

**Problem:** Duplicate content from linkedinpreview.com, wasting your unique features

**Opportunity:** 8,000-18,000 monthly searches for untapped keywords

**Solution:** Complete content overhaul + 3-5 supporting blog posts

**Investment:** ~60-80 hours (4-6 weeks) or $8,000-11,000

**Expected Return:**
- Month 3: Eliminate duplicate content penalty
- Month 6: 500+ organic clicks/month from target keywords
- Month 12: 2,000-5,000+ organic clicks/month, established authority

**Payback:** 3-6 months

---

### Success Definition

✅ **Success means:**
- Zero duplicate content warnings in Search Console
- Top 3 ranking for 20+ target keywords
- 2,000-5,000+ organic clicks/month
- 5-10% signup rate from tool users

⚠️ **Risk mitigation:**
- Conservative timeline (not overpromising rankings)
- Continuous monitoring and iteration
- Blog content support for long-tail keywords

---

## Quick File Reference

| Document | Use Case | Length |
|----------|----------|--------|
| **EXECUTIVE_SUMMARY.md** | 5-minute overview | 4 pages |
| **SEO_STRATEGY.md** | Deep strategic dive | 20+ pages |
| **COPY_TEMPLATES.md** | Ready-to-use copy | 15+ pages |
| **QUICK_REFERENCE.md** | This file | 2-3 pages |

---

## Frequently Asked Questions (Internal)

**Q: Why not just update a few sentences?**
A: Duplicate content requires a complete rewrite, not minor tweaks.

**Q: Should we mention we're inspired by linkedinpreview.com?**
A: Yes, briefly. "Originally inspired by linkedinpreview.com, EngageKit has evolved to include save, share, and team collaboration features."

**Q: How much different should the copy be?**
A: Completely different structure, unique keywords, and different features emphasized. Not just words rearranged.

**Q: What if users prefer the original tool?**
A: Both tools serve different use cases. We're optimizing for team/professional users, they're for solo creators.

**Q: Should we block the original site?**
A: No. It's open source; we acknowledge it. We just differentiate.

**Q: When can we launch?**
A: 4-6 weeks for full implementation, 1-2 weeks for MVP content update.

---

**For questions, contact:**
- Copywriting lead: [NAME]
- SEO lead: [NAME]
- Product lead: [NAME]
- Project manager: [NAME]

---

**Last Updated:** December 2025
**Status:** Ready for Team Distribution
