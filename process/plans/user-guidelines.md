# EngageKit Chrome Extension — LinkedIn Safety Context Document

> **Purpose:** This document provides context for future conversations about making the EngageKit Chrome extension safer and more human-like to avoid LinkedIn account restrictions.

---

## 1. The Problem

### What Happened

A customer using the EngageKit Chrome extension (which helps users comment on LinkedIn posts) had their LinkedIn account temporarily restricted. LinkedIn detected “software that automates activity” and blocked the account until February 05, 2026 5:25 PM PST.

### Root Cause Analysis

The customer was commenting approximately **100 times per day** on a **previously inactive account**. This sudden spike in activity from a dormant baseline is exactly what LinkedIn’s detection systems flag.

Key factors that triggered the restriction:

- **Activity spike from baseline:** Account went from inactive → 100 comments/day overnight
- **Pattern detection:** LinkedIn uses ML to analyze behavior patterns, timing, and text patterns
- **Chrome extension fingerprint:** Browser extensions are easier for LinkedIn to detect because they inject code directly into the webpage

---

## 2. How LinkedIn Detects Automation (2025-2026)

### Detection Methods

LinkedIn’s detection has evolved from simple rate limits to sophisticated behavioral analysis:

1. **Adaptive Rate Limiting**

- LinkedIn’s rate limiting is now adaptive to **individual user behavior patterns** rather than applying universal thresholds
- Each account has an implicit “reputation score” based on historical activity
- Sudden deviations from an account’s baseline trigger flags regardless of absolute volume

1. **Machine Learning Pattern Recognition**

- Analyzes behavior patterns, timing, content relevance, device consistency, and location consistency
- Can identify engagement pods with 97% accuracy
- Tracks comment velocity, account relationships, and semantic content of comments

1. **Text Pattern Analysis**

- Actively identifies and deprioritizes AI-generated comments
- Generic responses like “Great post!” or emoji-only reactions are flagged
- Repetitive writing styles, similar sentence structures, or templated text get detected

1. **Timing Analysis**

- “Perfect heartbeat” patterns (e.g., action every exactly 30 seconds) are immediate red flags
- Human behavior is chaotic — reading, pausing, scrolling, then acting
- Rapid-fire activity in short bursts triggers velocity filters

### LinkedIn’s Official Position (August 2025)

LinkedIn updated its documentation to explicitly state:

> “To keep LinkedIn safe and professional, we may limit how many comments a member or a LinkedIn Page can make in a certain time period. Similarly, if we detect excessive comment creation or use of an automation tool, we may limit the visibility of those comments.”

### Consequences of Detection

1. **Comment visibility reduction** — Comments still post but aren’t shown to others
1. **Temporary account restriction** — Account locked for a specified period (like our customer)
1. **Permanent account suspension** — For repeated or severe violations, resulting in loss of entire professional network

---

## 3. Safe Usage Guidelines

### Recommended Daily Limits

| Account Type                      | Max Comments/Day | Notes                             |
| --------------------------------- | ---------------- | --------------------------------- |
| New/Inactive (< 30 days active)   | 10-15            | Start here, ramp up slowly        |
| Growing (30-90 days active)       | 20-35            | Increase by ~5/week               |
| Established (90+ days consistent) | 40-50            | Never exceed even for power users |

**Note:** Some power users like Jasmin Alec can do 500 comments/day — but they’ve built that tolerance over years of consistent activity. New users cannot replicate this safely.

### Warm-up Protocol

1. **Week 1:** 10-15 comments/day maximum
1. **Weeks 2-3:** Increase to 20-30/day if no issues
1. **Month 2:** Scale to 30-40/day based on performance
1. **Month 3+:** Established accounts may reach 40-50/day

**Critical:** After any account restriction, users must restart the warm-up process from scratch.

### Timing Best Practices

- **Delay between comments:** 2-10 minutes (randomized, not uniform)
- **Session breaks:** 15-30 minute pauses every 8-12 comments
- **Daily active window:** Spread across 6-8 hours, not concentrated bursts
- **No more than 3-4 comments** in any 30-minute window

### Text Pattern Variation

- Never use generic phrases: “Great post!”, “Love this!”, “Thanks for sharing”
- Enforce minimum comment length (20+ words)
- Vary comment structure, length, tone, and vocabulary
- Use multiple “personas” with distinct writing styles
- No two consecutive comments should share similar structural patterns

---

## 4. Technical Considerations

### Browser Extensions vs. Other Approaches

**Browser extensions (what EngageKit is) are the most detectable form of automation:**

- They inject code directly into the webpage LinkedIn is serving
- LinkedIn can detect the presence of extensions more easily than cloud-based tools
- Activity only occurs when the browser is open, creating unnatural patterns

**Cloud-based tools** have advantages:

- Can run continuously without requiring the device to be active
- Implement sophisticated measures to mimic human behavior patterns
- Use dedicated IPs that don’t correlate with personal browsing

### What Makes Activity Look “Bot-Like”

| Bot Pattern                                                          | Human Pattern                                                    |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Fixed intervals between actions                                      | Random, variable delays                                          |
| Linear sequence: Profile → Wait → Connect → Profile → Wait → Connect | Chaotic: Scroll → Like → Comment → Profile → Read → Coffee break |
| Activity 24/7 or in perfect time blocks                              | Activity clustered in realistic working hours with gaps          |
| Identical text patterns across comments                              | Varied structure, length, vocabulary                             |
| Sudden high-volume activity                                          | Gradual ramp-up from established baseline                        |

---

## 5. Product Requirements for Safety Features

### Must-Have Features

1. **Account Warm-up / Ramp-up System**

- Track user’s baseline activity level
- Enforce gradual increases (5/week)
- Hard caps based on account maturity
- Display remaining daily quota in UI

1. **Randomized Human-like Timing**

- Random delays between comments (2-10 min range, weighted toward 3-5 min)
- Forced session breaks every 8-12 comments
- “Reading time” simulation proportional to post length
- Activity spread across 6-8 hour window

1. **Text Pattern Variation System**

- Multiple personas per account with distinct writing styles
- Auto-rotation between personas
- Block known generic patterns
- Enforce minimum comment length
- Structural variation detection

1. **Hard Daily Caps**

- Non-overridable limits based on account maturity
- Clear “X comments remaining” counter
- Block action when limit reached with explanation

1. **Safety Dashboard**

- Visual account health indicator (green/yellow/red)
- Historical activity log
- Warning when approaching risky thresholds
- Real-time guidance

### Nice-to-Have Features

- Reputation score estimation based on account characteristics
- Automatic slowdown when detection risk increases
- Integration with activity on other platforms to diversify patterns
- Suggested optimal commenting windows based on user’s timezone

---

## 6. Customer Recovery Guide

### When Account Gets Restricted

1. **Wait out the restriction period** — Do not try to circumvent it
1. **Do NOT create a new account** — LinkedIn detects and flags this unfavorably
1. **Review and disable any automation tools** per LinkedIn’s instructions
1. **Once restored, restart warm-up from scratch** — Start at 10-15 comments/day
1. **Use new personas** to avoid repeating flagged text patterns

### What to Tell Affected Customers

> “Your account was flagged because of a sudden spike in activity from your previous baseline. LinkedIn uses adaptive detection that learns each account’s normal behavior — going from inactive to 100 comments/day triggered their systems.
>
> Once LinkedIn unblocks your account, we recommend:
>
> 1. Start with only 10-15 comments per day
> 1. Increase by about 5 comments per week
> 1. Use varied comment styles (we can help set up custom personas)
> 1. Spread your commenting across several hours, not all at once
>
> Think of it like warming up a new account — patience now prevents bigger problems later.”

---

## 7. Linear Issues Created

| Issue  | Project           | Priority   | Description                                                        |
| ------ | ----------------- | ---------- | ------------------------------------------------------------------ |
| ENG-79 | Bugs              | **Urgent** | Create custom personas for affected customers (assigned to Ky-Nam) |
| ENG-80 | EngageKit Product | High       | Implement account warm-up / ramp-up system                         |
| ENG-81 | EngageKit Product | High       | Add randomized delays and human-like timing                        |
| ENG-82 | EngageKit Product | High       | Build persona/voice variation system                               |
| ENG-83 | EngageKit Product | High       | Enforce hard daily caps and activity distribution                  |
| ENG-84 | EngageKit Product | Medium     | Add account health / safety dashboard                              |
| ENG-85 | Growth Flywheel   | Medium     | Research and estimate reputation score per user                    |
| ENG-86 | Manual Growth     | Medium     | Create customer-facing safe usage documentation                    |

---

## 8. Key Sources & References

- LinkedIn Help: “Automated activity on LinkedIn” — https://www.linkedin.com/help/linkedin/answer/a1340567
- LinkedIn Help: “Prohibited software and extensions” — https://www.linkedin.com/help/linkedin/answer/a1341387
- LinkedIn Help: “Account restrictions” — https://www.linkedin.com/help/linkedin/answer/a1340522
- Social Media Today: “LinkedIn Outlines New Measures To Combat Fake Engagement” (Aug 2025)
- Dux-Soup: “LinkedIn Automation Safety Guide: How to Avoid Account Restrictions in 2026” (Dec 2025)

---

## 9. Key Takeaways for Future Development

1. **The extension must protect users from themselves** — Hard caps that can’t be overridden
1. **Baseline matters more than absolute numbers** — An inactive account doing 50 comments is riskier than an active account doing 100
1. **Randomization is essential** — Timing, text patterns, and activity distribution must all vary
1. **Chrome extensions are inherently riskier** — Consider long-term architecture decisions
1. **LinkedIn is specifically targeting comment automation** as of August 2025 — This is now officially in their documentation
1. **Recovery requires patience** — Customers must restart warm-up after any restriction

---

_Last updated: February 6, 2026_
_Based on customer incident and research conducted on LinkedIn’s 2025-2026 detection systems_
