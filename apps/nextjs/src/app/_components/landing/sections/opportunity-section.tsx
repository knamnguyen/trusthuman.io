import { MESSAGING } from "../landing-content";
import { StatCard } from "../cards/stat-card";

export function OpportunitySection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.opportunity.headline}
          </h2>
          <p className="text-xl text-muted-foreground">
            {MESSAGING.opportunity.subheadline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MESSAGING.opportunity.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
