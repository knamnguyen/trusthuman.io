import { Zap, Brain, User, Handshake, Sparkles, Clock } from "lucide-react";

import { Card, CardContent } from "@sassy/ui/card";

import { MESSAGING } from "../landing-content";

// Icon mapping utility
const iconMap = {
  Zap: Zap,
  Brain: Brain,
  User: User,
  Handshake: Handshake,
  Sparkles: Sparkles,
  Clock: Clock,
};

export function ReduceSlopSection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.reduceSlop.headline}
          </h2>
          <p className="text-xl text-muted-foreground mb-2">
            {MESSAGING.reduceSlop.subheadline}
          </p>
          <p className="text-2xl font-bold text-primary">
            {MESSAGING.reduceSlop.coreValueProp}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MESSAGING.reduceSlop.benefits.map((benefit) => {
            const IconComponent = iconMap[benefit.icon as keyof typeof iconMap];
            return (
              <Card
                key={benefit.title}
                className="border-2 border-border bg-background shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]"
              >
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <IconComponent className="size-8 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
