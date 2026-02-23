"use client";

import { useState, useRef } from "react";
import { Download, MessageSquare, Camera, Award } from "lucide-react";

import { AccordionTabs, type AccordionTab } from "@sassy/ui/components/accordion-tabs";

import { MESSAGING } from "./landing-content";

const STEP_ICONS = [Download, MessageSquare, Camera, Award] as const;

function TiltingVideoCard({ videoPath, title }: { videoPath: string; title: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg)"
  );
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * -10;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`
    );
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full cursor-pointer"
      style={{
        transform,
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.3s ease-out",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glowing border effect */}
      <div
        className="from-primary/30 via-primary/50 to-primary/30 absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-75 blur-sm"
        style={{
          transform: "translateZ(-10px)",
        }}
      />

      {/* Main video card */}
      <div
        className="border-border bg-card relative overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          transform: "translateZ(0px)",
        }}
      >
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Video placeholder - will be replaced with actual video */}
          <video
            key={videoPath}
            src={videoPath}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Fallback overlay if video doesn't load */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="text-lg font-medium text-white/80">{title}</p>
          </div>
        </div>
      </div>

      {/* 3D shadow effect */}
      <div
        className="bg-primary/10 absolute inset-4 -z-10 rounded-2xl blur-2xl"
        style={{
          transform: "translateZ(-30px) translateY(20px)",
        }}
      />
    </div>
  );
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = MESSAGING.howItWorks.steps;

  // Convert steps to AccordionTab format
  const tabs: AccordionTab[] = steps.map((step, index) => ({
    id: index,
    icon: STEP_ICONS[index] ?? Download,
    title: step.title,
    description: step.description,
  }));

  return (
    <section className="bg-card overflow-hidden py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {MESSAGING.howItWorks.headline}
          </h2>
          <p className="text-muted-foreground text-lg">
            {MESSAGING.howItWorks.subheadline}
          </p>
        </div>

        {/* Accordion Tabs - Steps Row */}
        <AccordionTabs
          tabs={tabs}
          defaultActiveId={0}
          onTabChange={(id) => setActiveStep(id as number)}
          className="mb-10"
        />

        {/* Video Card - Changes based on active step */}
        <TiltingVideoCard
          videoPath={steps[activeStep]?.videoPath ?? "/videos/step-1-install.mp4"}
          title={steps[activeStep]?.title ?? "Install the Chrome Extension"}
        />
      </div>
    </section>
  );
}
