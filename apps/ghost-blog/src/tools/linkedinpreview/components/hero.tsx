import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";

import { Icons } from "../lib/icons";

const ASSET_BASE =
  "https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview";

export function Hero() {
  return (
    <>
      <section
        id="hero"
        className="relative container max-w-7xl pt-28 md:pt-36 lg:pt-44"
      >
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Tagline */}
          <div className="flex items-center gap-6">
            <Badge>Completely Free</Badge>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-wide text-balance md:text-5xl lg:text-6xl">
              LinkedIn Post Preview Tool with{" "}
              <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
                Save & Share
              </span>
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-balance md:text-xl">
              Preview your LinkedIn posts on mobile, tablet, and desktop. Save drafts, share preview links with your team, and optimize your hook before publishing. Completely free—no credit card required.
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground pr-2 text-sm font-semibold">
              4.9/5
            </span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icons.star
                key={i}
                className="mb-0.5 size-5 fill-yellow-500 text-yellow-500"
              />
            ))}
            <span className="text-muted-foreground pl-2 text-sm font-semibold">
              from 5421 Reviews
            </span>
          </div>

          {/* CTA */}
          <div className="space-x-4">
            <Button asChild>
              <a href="#linkedinpreviewer-tool">Get Started</a>
            </Button>
            <Button variant="secondary">
              <a href="#main-features">Learn more</a>
            </Button>
          </div>
        </div>
        <Background />
      </section>
    </>
  );
}

function Background() {
  return (
    <>
      <img
        alt="LinkedIn Post Preview Tool interface showing multi-device rendering and professional formatting options for mobile, tablet, and desktop preview"
        className="absolute inset-0 -z-10 size-full animate-pulse object-cover opacity-30"
        src={`${ASSET_BASE}/bg-pattern-filled.png`}
      />
      <div className="via-background/85 to-background absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-20% to-80%" />
    </>
  );
}
