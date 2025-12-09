import { Button } from "@sassy/ui/button";
import { Card, CardDescription, CardTitle } from "@sassy/ui/card";

import { Icon, Icons } from "../lib/icons";

const Features = [
  {
    icon: "formatting",
    title: "Advanced Formatting: Make Your Posts Look Great",
    body: "Our formatting tool makes your posts stand out with rich text and clean layouts, making sure they catch people's eyes right away.",
  },
  {
    icon: "preview",
    title: "Real-Time Preview: See It Before You Share It",
    body: "Check out how your post will look on different screens before you go live. This way, you can be sure it looks perfect, no matter where it's viewed.",
  },
  {
    icon: "dollar",
    title: "Completely Free and Open Source",
    body: "Access full functionality without any fees — perfect for professionals and companies of all sizes.",
  },
];

export function MainFeatures() {
  return (
    <section id="main-features" className="container max-w-6xl py-16 md:py-24">
      <div className="flex flex-col gap-16">
        <div className="mx-auto max-w-2xl space-y-6 md:text-center">
          <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">
            The{" "}
            <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
              Key Features{" "}
            </span>
            of this Linkedin Post Writing Tool{" "}
          </h2>

          <p className="text-muted-foreground max-w-[800px] text-balance md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            From intuitive formatting options to real-time preview, this tool is
            everything you need to create perfect linkedin posts.
          </p>
          <Button asChild>
            <a href="#myIframe">Focus Tool</a>
          </Button>
        </div>
        <Card className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x lg:grid-cols-3 lg:divide-y-0">
          {Features.map((feature) => (
            <div
              key={feature.title}
              className="group hover:shadow-primary/10 relative transition hover:z-[1] hover:shadow-2xl"
            >
              <div className="relative space-y-4 p-6 py-8">
                <Icon
                  name={feature.icon as keyof typeof Icons}
                  className="text-primary size-8"
                  aria-hidden="true"
                />
                <CardTitle className="text-xl font-bold tracking-wide">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-md mt-2">
                  {feature.body}
                </CardDescription>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}
