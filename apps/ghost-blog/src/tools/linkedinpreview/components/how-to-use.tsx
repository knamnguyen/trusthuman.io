import { Button } from "@sassy/ui/button";

const ASSET_BASE =
  "https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview";

const Steps = [
  {
    title: "Write or Paste Your Content",
    description:
      "Start with your LinkedIn post text. Include your hook (first 1-2 sentences visible before 'see more'), main message, and call-to-action.",
  },
  {
    title: "Apply Text Formatting",
    description:
      "Add bold text, italics, bullet points, numbered lists, and emojis. Watch changes update instantly in the preview pane.",
  },
  {
    title: "Preview Across All Devices",
    description:
      "Switch between mobile, tablet, and desktop views. See exactly where LinkedIn's 'see more' truncation happens on mobile (85% of traffic).",
  },
  {
    title: "Save & Share (Optional)",
    description:
      "Create a free account to save unlimited drafts and generate shareable preview links for team feedback. No credit card required.",
  },
  {
    title: "Get Team Feedback",
    description:
      "Share your preview link with managers, team members, or clients. They can view your formatted post without signing up.",
  },
  {
    title: "A/B Test Multiple Versions",
    description:
      "Save different versions with varying hooks, formatting, or CTAs. Track which gets better engagement after publishing.",
  },
  {
    title: "Copy & Publish to LinkedIn",
    description:
      "Click 'Copy Formatted Text' and paste into LinkedIn. All formatting is preserved using Unicode characters LinkedIn recognizes.",
  },
];

export function HowToUse() {
  return (
    <section id="how-it-works" className="container max-w-6xl py-16 md:py-24">
      <div className="flex flex-col gap-16">
        <div className="mx-auto max-w-2xl space-y-6 md:text-center">
          <h2 className="text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
            How to Use in{" "}
            <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
              7 Steps
            </span>
          </h2>

          <p className="text-muted-foreground mx-auto max-w-[700px] text-balance md:text-lg">
            Format, preview, and optimize your LinkedIn posts before publishing. Save drafts and get team feedback with shareable links.
          </p>
          <Button asChild>
            <a href="#linkedinpreviewer-tool">Try Tool Now</a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center">
          <div className="w-full pr-6 md:w-5/12">
            <ol className="relative border-s">
              {Steps.map((step, index) => (
                <li key={step.title} className="ms-4 mb-10">
                  <time className="text-muted-foreground mb-1 text-sm leading-none font-medium">
                    Step {index + 1}
                  </time>
                  <div className="absolute -start-1.5 mt-1.5 size-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
                  <h3 className="text-lg/relaxed font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-normal">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="w-full px-4 md:w-7/12 md:px-0 md:pt-0 md:pl-32">
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-label="Demo video showing LinkedIn post formatting and preview across multiple devices"
              className="over m-auto rounded-lg border shadow-xl md:max-h-[400px] md:object-cover md:object-left md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
            >
              <source
                src={`${ASSET_BASE}/linkedinpreviewer.mp4`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
