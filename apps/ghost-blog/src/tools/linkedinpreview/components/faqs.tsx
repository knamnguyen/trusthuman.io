import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sassy/ui/accordion";
import { Button } from "@sassy/ui/button";

const FAQList = [
  {
    question: "How is EngageKit's LinkedIn Preview Tool Different from Other Preview Tools?",
    answer:
      "We combine formatting + preview with authentication and sharing features. Other tools (like linkedinpreview.com) let you preview; we let you save drafts, generate shareable preview links for team feedback, and eventually track post performance. Use the tool free with no signup for basic preview. Create a free account if you want to save drafts or share. No credit card required, ever.",
  },
  {
    question: "What's the Difference Between Bold Text on LinkedIn—Why Use the Preview?",
    answer:
      "LinkedIn doesn't natively support text formatting. We use Unicode Mathematical Alphanumeric Symbols (special Unicode characters that look like bold, italic, etc.) to create formatted text. These display as bold on 98% of devices—but on older Android phones (less than 2% of traffic), they might show as boxes. Our preview shows EXACTLY what your audience will see on their specific device. Before copying to LinkedIn, you'll know if formatting works for your target audience.",
  },
  {
    question: "Where Does LinkedIn Cut Off My Post with 'See More'—How Do I Optimize the Hook?",
    answer:
      "LinkedIn typically truncates posts after ~1,300 characters or 5-7 lines, depending on your audience and content type. Your hook (first 1-2 sentences) is CRITICAL—this is what people see before the 'see more' cutoff. Our mobile preview shows exactly where truncation happens on iPhone, Android, and iPad. Craft your strongest hook in the visible area: compelling statement, surprising fact, question, or bold claim. Then provide reason to click 'see more.' This is crucial since 85% of LinkedIn traffic is mobile.",
  },
  {
    question: "Can I Save My LinkedIn Post Drafts and Come Back Later?",
    answer:
      "Yes, absolutely. Sign up for a free EngageKit account to save unlimited LinkedIn post drafts. Access saved posts anytime to refine, edit, repurpose, or publish later. Perfect for building a content library, A/B testing different versions, or planning ahead. Each saved post includes a shareable preview link you can send to team members. Free account—no credit card required.",
  },
  {
    question: "How Do I Get Team Feedback on My LinkedIn Post Before Publishing?",
    answer:
      "After saving a draft in your account, click 'Generate Shareable Link.' You'll get a unique preview URL. Send it to your manager, team members, clients, or colleagues. They can click the link and see your formatted post exactly as it will appear on LinkedIn—no signup needed on their end. They can provide feedback via email, Slack, or comments on the preview page. Much faster than traditional approval workflows.",
  },
  {
    question: "What Text Formatting Options Does Your Tool Support?",
    answer:
      "Bold text, italic text, underlined text, strikethrough text, bullet point lists (with symbols like • ◦ ▪), numbered lists (1. 2. 3.), Unicode special characters (★ ● ◆ → ✓ ◇), emojis (full emoji support), and combinations (bold + italic, list items with bold, etc.). Every format updates in real-time as you type. Preview shows exactly how each format renders on mobile, tablet, and desktop.",
  },
  {
    question: "Why Does Formatting Improve LinkedIn Post Engagement—What's the Science?",
    answer:
      "Formatted posts are more scannable, visually distinct, and easier to read. LinkedIn's algorithm rewards early engagement (likes, comments, shares in the first hour). Better formatting = better readability = faster user reactions = higher algorithmic boost. Research shows formatted LinkedIn posts get 2-3x more engagement than plain text. Bullet-pointed content is 30% more readable. Listicles (numbered/bulleted posts) get 40% more engagement. Strategic formatting is not just cosmetic—it impacts post performance.",
  },
  {
    question: "Is This Tool Completely Free? Do I Need to Upgrade to Premium?",
    answer:
      "Yes, completely free. Basic features (formatting, live preview, device simulation, copy-to-clipboard) are forever free. No ads, no limitations on preview count. Create a free account if you want to save drafts or get shareable links—still free. Premium features (advanced analytics, template library) may come in 2025, but core tool will always be free. No credit card required, no upsell, no hidden costs.",
  },
  {
    question: "How Accurate Is Your Multi-Device Preview? Can I Trust It?",
    answer:
      "We aim for 99% accuracy by using LinkedIn's rendering behavior for most formats. However, LinkedIn occasionally changes how it displays formatted text without warning. Mobile behavior also varies slightly by device and LinkedIn app version. For mission-critical posts, preview one last time on LinkedIn before final publish. For most posts, our preview is extremely accurate—you'll catch issues 99% of the time. No formatting surprises after publishing.",
  },
  {
    question: "Can I Collaborate with My Team or Clients Using This Tool?",
    answer:
      "Yes, that's a core feature. Save your draft, generate a shareable preview link, and send to teammates. They see your formatted post exactly as LinkedIn will display it—no signup needed on their end. Perfect for content teams, agencies managing multiple client accounts, corporate social media managers, and anyone needing approval before publishing. Feedback loop is much faster than traditional email/screenshot workflows.",
  },
  {
    question: "What's the Best Structure for a High-Engagement LinkedIn Post?",
    answer:
      "The formula: Strong hook (first 1-2 sentences visible before 'see more') → Clear value proposition → Supporting points (use bullets for clarity) → Direct CTA (Like? Comment? Share? DM? Click link?). Format your hook in bold or with emoji for immediate impact. Use strategic line breaks for whitespace (crucial on mobile). End with specific CTA. Our preview helps you perfect each element. Listicles ('5 ways to...', 'Top 3...', 'Steps to...') perform 40% better than narrative-only posts.",
  },
  {
    question: "Why Preview Posts When I Can Just Publish and Edit Later?",
    answer:
      "LinkedIn shows edits with a small 'edited' label, which the algorithm slightly penalizes. More importantly, early engagement matters most—if your post isn't compelling in the first 15 minutes, you lose momentum. The algorithm prioritizes posts that get immediate reactions. Formatting mistakes after publishing lose that critical early boost. Preview prevents regrettable formatting errors and ensures your hook is perfect before the first engagement happens. Better to preview than to edit. Takes 2 minutes and saves hours of regret.",
  },
];

export function FAQs() {
  return (
    <section id="faqs" className="container max-w-6xl py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQList.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-balance md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Everything you need to know about EngageKit's LinkedIn Preview Tool, including save features, team collaboration, formatting accuracy, and mobile optimization. Get answers to technical questions and learn best practices.
          </p>
          <Button asChild>
            <a href="#linkedinpreviewer-tool">Focus Tool</a>
          </Button>
        </div>
        <div className="space-y-8 text-center">
          <Accordion type="multiple">
            {FAQList.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="gap-4 text-start">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-start">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Button asChild>
            <a href="#linkedinpreviewer-tool">Focus Tool</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
