import { Button } from "@sassy/ui/button";
import { Card, CardDescription, CardTitle } from "@sassy/ui/card";

import { Icon, Icons } from "../lib/icons";

const Features = [
  {
    icon: "save",
    title: "Save & Manage Multiple Post Drafts",
    body: "Create and save unlimited LinkedIn post drafts to your account. Test different headlines, formatting, and calls-to-action without publishing yet. Access your saved posts anytime to refine, A/B test, or repurpose. Perfect for LinkedIn content strategy and version testing.",
  },
  {
    icon: "link",
    title: "Generate Shareable Preview Links for Team Feedback",
    body: "Generate a unique, shareable link for each LinkedIn post draft. Send to your manager, team members, client, or agency for real-time feedback. Reviewers don't need to create an account—they just click the link and see your formatted post exactly as LinkedIn will display it. Faster feedback loop than email screenshots.",
  },
  {
    icon: "mobile",
    title: "Accurate Multi-Device Preview (Mobile, Tablet, Desktop)",
    body: "Your LinkedIn hook (opening line) is critical—it's what appears before 'see more' on mobile. 85% of LinkedIn users access via mobile, so mobile rendering matters most. Our preview shows exactly where LinkedIn truncates your text on iPhone, Android, Samsung, and desktop browsers. Optimize your hook to maximize first-impression impact. No guessing about formatting or device rendering.",
  },
  {
    icon: "formatting",
    title: "Professional Text Formatting Tools",
    body: "Add bold text to emphasize key points. Use italic for quotes and technical terms. Create bullet point lists for clarity. Use numbered lists for step-by-step processes. Include emojis strategically for visual distinction. Support for Unicode special characters (★, ●, ◆, →, ✓). Watch all formatting changes update instantly in the preview pane. Test combinations: bold + italic, bullets with bold text, emoji with formatting—all supported.",
  },
  {
    icon: "dollar",
    title: "Completely Free—No Signup Required (Optional Account)",
    body: "Use the core tool completely free: formatting, live preview, device simulation, and copy-to-clipboard. No ads. No limitations on preview count. No registration required. Create an account only if you want to save drafts or generate shareable links. Free account, forever free—no credit card required, no upsell, no subscription.",
  },
  {
    icon: "chart",
    title: "Performance Insights (Coming 2025)",
    body: "Saved posts will display performance metrics after you publish to LinkedIn. Track engagement (likes, comments, shares), reach, impressions, and click-through rates. Understand what formatting, hooks, and structures perform best. Refine your LinkedIn content strategy based on real data. (Feature launching Q1 2025)",
  },
];

export function MainFeatures() {
  return (
    <section id="main-features" className="container max-w-6xl py-16 md:py-24">
      <div className="flex flex-col gap-16">
        <div className="mx-auto max-w-2xl space-y-6 md:text-center">
          <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">
            Professional Features for{" "}
            <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
              LinkedIn Content Teams
            </span>
          </h2>

          <p className="text-muted-foreground max-w-[800px] text-balance md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Save multiple drafts, share preview links with your team, and preview across all devices. Everything you need to create professional, team-approved LinkedIn posts before publishing.
          </p>
          <Button asChild>
            <a href="#linkedinpreviewer-tool">Focus Tool</a>
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
