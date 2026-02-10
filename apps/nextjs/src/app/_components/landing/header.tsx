"use client";

import Image from "next/image";

import { NavBlog } from "@sassy/ui/components/nav-blog";

import { useBlogPosts } from "~/hooks/use-blog-posts";
import { useTools } from "~/hooks/use-tools";

// Landing page logo component
function LandingLogo() {
  return (
    <a href="/" className="mx-auto flex items-center gap-2 md:mx-0">
      <Image
        src="/engagekit-logo.svg"
        alt="EngageKit Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-lg font-bold">EngageKit</span>
    </a>
  );
}

// Landing page mobile menu items
const landingMobileMenuItems = [
  { label: "Free Tools", href: "https://blog.engagekit.io/tag/tool" },
  { label: "Blog", href: "https://blog.engagekit.io" },
];

export const Header = () => {
  // Fetch real data from Ghost CMS
  const { blogItems, isLoading: blogItemsLoading } = useBlogPosts();
  const { toolItems, isLoading: toolItemsLoading } = useTools();

  const handleCtaClick = () => {
    window.open(
      "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
      "_blank",
    );
  };

  return (
    <NavBlog
      logo={<LandingLogo />}
      ctaText="Add to Chrome"
      ctaOnClick={handleCtaClick}
      mobileMenuItems={landingMobileMenuItems}
      showDropdowns={true}
      toolItems={toolItems}
      toolItemsLoading={toolItemsLoading}
      blogItems={blogItems}
      blogItemsLoading={blogItemsLoading}
    />
  );
};
