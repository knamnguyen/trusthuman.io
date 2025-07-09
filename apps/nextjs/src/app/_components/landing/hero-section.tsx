"use client";

import Image from "next/image";

import { Button } from "@sassy/ui/button";

import { RotatingTitles } from "./rotating-titles";

const titles = [
  "You :)",
  "Solopreneurs",
  "Content Creators",
  "Job Applicants",
  "Startup Founders",
  "Students",
  "Marketers",
  "Salespeople",
  "Indie Builders",
  "Thought Leaders",
  "Influencers",
  "Recruiters",
  "Consultants",
  "Freelancers",
  "Agency Owners",
  "Business Leaders",
  "C-Suite Executives",
];

export function HeroSection() {
  const handleScrollToCTA = () => {
    document
      .getElementById("final-cta")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container flex flex-col items-center gap-6 py-24 text-center sm:py-32">
      <Image
        src="/engagekit-logo.svg"
        alt="EngageKit Logo"
        width={120}
        height={120}
        className="mt-[-50px] mb-[-50px] h-70 w-70"
      />
      <h1 className="flex flex-wrap items-center justify-center gap-x-4 text-5xl font-extrabold tracking-tighter [word-spacing:0.15em] sm:text-7xl">
        <span>
          AI LinkedIn Engagement Intern <br />
          that works 24/7 for
        </span>
        <RotatingTitles titles={titles} />
      </h1>
      <p className="max-w-2xl text-lg text-gray-600">
        100 human-like comments/day on auto-pilot <br />
        Get your LinkedIn profile reach 100k+ <br />
        Thousands of new followers <br />
        Save 30 hours a month <br />
        Free to get started
      </p>
      <div>
        {/* Original Chrome extension link preserved for reference: */}
        {/* https://chrome.google.com/webstore/detail/inobbppddbakbhhfkfkinmicnbpeekok */}
        <Button
          size="lg"
          onClick={() => {
            if (typeof window !== "undefined" && (window as any).Tally) {
              (window as any).Tally.openPopup("woN0Re", {
                layout: "modal",
                width: 700,
              });
            }
          }}
          className="cursor-pointer rounded-md border-2 border-black bg-pink-500 p-6 text-lg font-bold text-white shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none sm:p-8 sm:text-xl"
        >
          I want to grow my f*cking LinkedIn
        </Button>
      </div>
    </section>
  );
}
