"use client";

import Image from "next/image";

import { Button } from "@sassy/ui/button";

import { RotatingTitles } from "./rotating-titles";

const titles = [
  "Solopreneurs",
  "Content Creators",
  "Job Applicants",
  "Startup Founders",
  "Students",
  "Marketers",
  "Sales Professionals",
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
        className="mt-[-50px] mb-[-50px] h-80 w-80"
      />
      <h1 className="flex flex-wrap items-center justify-center gap-x-4 text-5xl font-extrabold tracking-tighter sm:text-7xl">
        <span>AI Intern that works 24/7 for </span>
        <RotatingTitles titles={titles} />
      </h1>
      <p className="max-w-2xl text-lg text-gray-600">
        Do 100 human-like comments a day for you, on auto-pilot. <br />
        Get your profile reach 100k+ people. <br />
        Thousands of new followers. <br />
        Save 30 hours a month. <br />
        Free to get started.
      </p>
      <div>
        <Button size="lg" className="bg-pink-500 text-white hover:bg-pink-600">
          Get Started for Free
        </Button>
      </div>
    </section>
  );
}
