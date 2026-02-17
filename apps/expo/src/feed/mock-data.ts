/**
 * Mock feed data — mirrors the nextjs app's mock data
 * (apps/nextjs/.../feed/_components/mock-data.ts).
 *
 * Will be replaced by tRPC queries once the backend feed endpoints are ready.
 */

import type { FeedItem } from "./types";

export const mockFeedItems: FeedItem[] = [
  {
    id: "feed-1",
    post: {
      id: "post-1",
      postUrl: "https://linkedin.com/posts/1",
      postFullCaption:
        "Excited to announce that our startup just closed a $15M Series A round. It's been an incredible journey building in the AI infrastructure space, and I'm grateful for the team that made this possible.",
      postCreatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      authorName: "Sarah Chen",
      authorProfileUrl: "https://linkedin.com/in/sarahchen",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=sarah",
      authorHeadline: "CEO & Co-Founder at NeuralStack | AI Infrastructure",
    },
    aiComment:
      "Congratulations on the Series A, Sarah! Building in the AI infrastructure space is no small feat. Wishing you and the team continued success.",
    touchScore: 82,
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "feed-2",
    post: {
      id: "post-2",
      postUrl: "https://linkedin.com/posts/2",
      postFullCaption:
        "Hot take: Most companies don't need a microservices architecture. A well-structured monolith can handle millions of users. Stop over-engineering your systems before you even have product-market fit.",
      postCreatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      authorName: "Marcus Johnson",
      authorProfileUrl: "https://linkedin.com/in/marcusjohnson",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=marcus",
      authorHeadline:
        "Principal Engineer at Stripe | Distributed Systems",
    },
    aiComment:
      "This resonates deeply. I've seen too many early-stage teams spend months on Kubernetes setups when a single server would have sufficed. Simplicity wins.",
    touchScore: 45,
    status: "pending",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "feed-3",
    post: {
      id: "post-3",
      postUrl: "https://linkedin.com/posts/3",
      postFullCaption:
        "Just published my guide on building effective engineering teams. After managing 200+ engineers across three companies, here are the patterns that actually work for hiring, onboarding, and retention.",
      postCreatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      authorName: "Priya Patel",
      authorProfileUrl: "https://linkedin.com/in/priyapatel",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=priya",
      authorHeadline:
        "VP Engineering at Datadog | Building high-performance teams",
    },
    aiComment:
      "Great insights, Priya. The onboarding section especially stood out. Would love to hear more about how you measure team health over time.",
    touchScore: 73,
    status: "pending",
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
  },
  {
    id: "feed-4",
    post: {
      id: "post-4",
      postUrl: "https://linkedin.com/posts/4",
      postFullCaption:
        "The future of work is async-first. We moved our entire company to a 4-day work week with no meetings on Fridays. Productivity went up 23% and turnover dropped to near zero.",
      postCreatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      authorName: "Alex Rivera",
      authorProfileUrl: "https://linkedin.com/in/alexrivera",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=alex",
      authorHeadline:
        "Founder at RemoteFirst Labs | Future of Work Advocate",
    },
    aiComment:
      "Impressive results! The no-meetings Friday policy is something more companies should consider. Do you have data on how this affected cross-team collaboration?",
    touchScore: 38,
    status: "pending",
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
  },
  {
    id: "feed-5",
    post: {
      id: "post-5",
      postUrl: "https://linkedin.com/posts/5",
      postFullCaption:
        "I interviewed 50 CTOs this year. The #1 challenge they all share? Not technical debt, not hiring. It's communicating engineering value to the board. Here's my framework for bridging that gap.",
      postCreatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      authorName: "David Kim",
      authorProfileUrl: "https://linkedin.com/in/davidkim",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=david",
      authorHeadline: "CTO Coach & Advisor | Ex-Google, Ex-Meta",
    },
    aiComment:
      "This is such an underrated topic. Would love to see more examples of how CTOs quantify engineering impact for non-technical stakeholders.",
    touchScore: 22,
    status: "pending",
    createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
  },
  {
    id: "feed-6",
    post: {
      id: "post-6",
      postUrl: "https://linkedin.com/posts/6",
      postFullCaption:
        "We just open-sourced our internal design system after two years of development. It includes 80+ components, accessibility-first approach, and full Figma integration. Check it out!",
      postCreatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      authorName: "Emma Watson",
      authorProfileUrl: "https://linkedin.com/in/emmawatson-design",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=emma",
      authorHeadline: "Head of Design Systems at Shopify",
    },
    aiComment:
      "Amazing work on the open-source release! The accessibility-first approach is exactly what the industry needs more of.",
    touchScore: 55,
    status: "pending",
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: "feed-7",
    post: {
      id: "post-7",
      postUrl: "https://linkedin.com/posts/7",
      postFullCaption:
        "Unpopular opinion: LinkedIn engagement pods are the new email spam. If your content can't stand on its own merits, maybe it's time to rethink your messaging rather than gaming the algorithm.",
      postCreatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
      authorName: "James Morrison",
      authorProfileUrl: "https://linkedin.com/in/jamesmorrison",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=james",
      authorHeadline:
        "Marketing Director at HubSpot | Content Strategy",
    },
    aiComment:
      "Couldn't agree more. Authentic engagement always outperforms manufactured interactions in the long run.",
    touchScore: 15,
    status: "pending",
    createdAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
  },
  {
    id: "feed-8",
    post: {
      id: "post-8",
      postUrl: "https://linkedin.com/posts/8",
      postFullCaption:
        "After 10 years in big tech, I took the leap and joined a 5-person startup. The salary cut was significant, but the learning curve has been exponential. Best decision I ever made.",
      postCreatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      authorName: "Lisa Nguyen",
      authorProfileUrl: "https://linkedin.com/in/lisanguyen",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=lisa",
      authorHeadline: "Head of Product at Stealth Startup | Ex-Amazon",
    },
    aiComment:
      "Love hearing stories like this. The transition from big tech to startup life is a huge mindset shift but incredibly rewarding.",
    touchScore: 18,
    status: "pending",
    createdAt: new Date(Date.now() - 35 * 60 * 60 * 1000),
  },
];
