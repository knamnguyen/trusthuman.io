import { MESSAGING } from "../landing-content";
import { StepCard } from "../cards/step-card";

export function HowItWorksSection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.howItWorks.headline}
          </h2>
          <p className="text-xl text-muted-foreground">
            {MESSAGING.howItWorks.subheadline}
          </p>
        </div>

        <div className="space-y-24">
          {MESSAGING.howItWorks.steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
