"use client";

import Image from "next/image";

import type { FooterColumn, SocialLink } from "@sassy/ui/components/footer-component";
import { FooterComponent } from "@sassy/ui/components/footer-component";

// Landing page logo component
function LandingFooterLogo() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Image
          src="/engagekit-logo.svg"
          alt="EngageKit Logo"
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <h2 className="text-xl font-bold sm:text-2xl">EngageKit</h2>
      </div>
    </div>
  );
}

// Landing page footer columns
const landingFooterColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#key-features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Chrome Extension", href: "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "https://blog.engagekit.io" },
      { label: "Free Tools", href: "https://blog.engagekit.io/tag/tool" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Affiliates", href: "https://engagekit.endorsely.com" },
      { label: "Contact", href: "mailto:support@engagekit.io" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

// Social links
const landingSocialLinks: SocialLink[] = [
  { platform: "x", href: "https://x.com/engagekit_io" },
  { platform: "linkedin", href: "https://linkedin.com/company/engagekit" },
  { platform: "youtube", href: "https://youtube.com/@engagekit" },
];

export const Footer = () => {
  return (
    <FooterComponent
      logo={<LandingFooterLogo />}
      description="Build authentic relationships on LinkedIn that drive real business outcomes. The relationship-building engine for professionals."
      columns={landingFooterColumns}
      copyright="© 2025 EngageKit. Built for creators."
      tagline="Made with ☕ for LinkedIn professionals"
      socialLinks={landingSocialLinks}
    />
  );
};
