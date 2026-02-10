import {
  Brain,
  UserCheck,
  Target,
  BarChart3,
  Users,
  Paintbrush,
} from "lucide-react";

import { Card, CardContent } from "@sassy/ui/card";

import { MESSAGING } from "../landing-content";

// Icon mapping utility
const iconMap = {
  Brain: Brain,
  UserCheck: UserCheck,
  Target: Target,
  BarChart3: BarChart3,
  Users: Users,
  Paintbrush: Paintbrush,
};

export function KeyFeaturesGrid() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.keyFeatures.headline}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MESSAGING.keyFeatures.features.map((feature) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <Card
                key={feature.title}
                className="border-2 border-border bg-card shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]"
              >
                <CardContent className="flex items-start gap-4 p-6">
                  <IconComponent className="size-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
