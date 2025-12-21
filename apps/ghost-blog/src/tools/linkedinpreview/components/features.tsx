import { Button } from "@sassy/ui/button";
import { Card, CardDescription, CardTitle } from "@sassy/ui/card";

import { Icon, Icons } from "../lib/icons";

const AllFeatures = [
  {
    icon: "mobile",
    title: "Mobile Preview (iPhone & Android Rendering)",
    body: "LinkedIn's mobile app displays posts differently than desktop. Your opening line (the hook) gets cut off with 'see more' after ~1,300 characters or 5-7 lines. Our mobile preview shows exactly where truncation happens on iPhone 12, iPhone 14, Samsung Galaxy, and Android phones. 85% of LinkedIn traffic comes from mobile, so mobile rendering is critical. Test your hook to ensure maximum impact in the first visible area. See formatting exactly as your mobile-first audience will see it.",
  },
  {
    icon: "desktop",
    title: "Desktop Preview (Large Screen Rendering)",
    body: "Desktop browsers display LinkedIn posts wider, with more text per line. Formatting that looks good on mobile might look different on desktop—especially bullet points and line breaks. Our desktop preview shows how your post renders on Chrome, Safari, Firefox, and Edge. While only 15% of LinkedIn traffic is desktop, desktop viewers often include recruiters, executives, and business decision-makers. Optimize for both mobile and desktop to maximize reach and credibility.",
  },
  {
    icon: "tablet",
    title: "Tablet Preview (iPad & Android Tablet Rendering)",
    body: "Tablet users (iPad, Android tablets) view LinkedIn differently than phones or desktops. Text sizing, line wrapping, and emoji rendering varies. Our tablet preview shows how your formatted LinkedIn post appears on iPad and large-screen Android devices. Ensure your formatting and hook work across all device sizes.",
  },
  {
    icon: "bold",
    title: "Bold Text Generator & Preview",
    body: "Not all bold text generators render the same across devices. LinkedIn uses Unicode Mathematical Alphanumeric Symbols (mathematical alphanumerics) to display 'bold' text—they're not actually bold, but they look bold. Our tool shows you exactly how bold text will render on mobile, tablet, and desktop before you post. Test bold variations: **key phrase**, **entire sentences**, or **mixed formatting**. Research shows formatted posts get 2-3x more engagement. See results instantly in our live preview before copying to LinkedIn.",
  },
  {
    icon: "italic",
    title: "Italic Text Support & Preview",
    body: "Use italic formatting to emphasize quotes, define technical terms, or add emphasis to important phrases. Our preview shows exactly how italic text renders on mobile, tablet, and desktop. Italic is less scannable than bold on mobile, so use sparingly for key emphasis. Combine italic with bold for maximum impact: ***Bold + Italic***.",
  },
  {
    icon: "strikethrough",
    title: "Strikethrough Text for Contrast",
    body: "Use strikethrough to show what used to be true or to create contrast in your message. Example: '~~Traditional marketing~~ → Digital-first marketing.' Preview exactly how strikethrough renders across devices. Works well with bullet points and comparisons.",
  },
  {
    icon: "underline",
    title: "Underline Formatting for Emphasis",
    body: "Underline formatting draws the reader's eye to specific text. Use for calls-to-action, critical information, or key metrics. Preview underlined text on mobile and desktop to ensure readability.",
  },
  {
    icon: "bulletList",
    title: "Bullet Point Lists for Clarity & Scannability",
    body: "LinkedIn feeds are designed for scanning, not deep reading. Break up text blocks with strategic bullet points. Our preview shows exactly how bullets render on mobile (where most users scan) vs desktop. Use bullets for: key takeaways, pros/cons lists, tips, features, requirements. Bulleted content is 30% more readable than solid text blocks. Combine bullets with bold text for maximum impact: **• Bold point**.",
  },
  {
    icon: "numberedList",
    title: "Numbered Lists for Step-by-Step Processes",
    body: "Use numbered lists to structure step-by-step content, rankings, or sequential processes. Format: 1. First step, 2. Second step, 3. Third step. Perfect for: '5 Steps to [outcome]', '3 Reasons why [statement]', 'Top 10 [items]', 'How to [accomplish goal] in [N] steps'. Preview exactly how numbered lists appear on mobile and desktop. Listicle-format posts typically get 40% more engagement than narrative-only posts. Combine numbered lists with bold and emojis for maximum visual impact.",
  },
];

export function Features() {
  return (
    <section
      id="all-features"
      className="bg-muted w-full py-12 md:py-16 lg:py-24"
    >
      <div className="container flex max-w-6xl flex-col gap-16">
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">
            Complete Formatting & Preview Toolkit
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[600px] text-balance md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Professional text formatting with accurate multi-device preview. See exactly how bold text, italic emphasis, bullet points, and emoji render on every device before you publish. Optimize for mobile-first LinkedIn audiences.
          </p>
          <Button asChild>
            <a href="#linkedinpreviewer-tool">Focus Tool</a>
          </Button>
        </div>

        <div className="grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3">
          {AllFeatures.map((feature) => (
            <Card
              key={feature.title}
              className="group relative transition hover:z-[1] hover:shadow-2xl"
            >
              <div className="relative space-y-4 p-6 py-8">
                <Icon
                  name={feature.icon as keyof typeof Icons}
                  className="bg-primary/10 text-primary size-9 rounded-md p-1.5"
                  aria-hidden="true"
                />
                <CardTitle className="text-xl font-bold tracking-wide">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-md mt-2">
                  {feature.body}
                </CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
