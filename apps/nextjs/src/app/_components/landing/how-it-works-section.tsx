"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Download, MessageSquare, Camera, Award } from "lucide-react";

import { AccordionTabs, type AccordionTab } from "@sassy/ui/components/accordion-tabs";

import { MESSAGING } from "./landing-content";

const STEP_ICONS = [Download, MessageSquare, Camera, Award] as const;

function TiltingVideoCard({ videoPath, title }: { videoPath: string; title: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring config for smooth animation
  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };

  // Transform mouse position to rotation with spring
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);
  const scale = useSpring(1, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    scale.set(1.01);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full cursor-pointer"
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        perspective: 1000,
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
    </motion.div>
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
