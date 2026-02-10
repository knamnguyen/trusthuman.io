import { Rocket, Handshake, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { MESSAGING } from "../landing-content";

// Icon mapping utility
const iconMap = {
  Rocket: Rocket,
  Handshake: Handshake,
  TrendingUp: TrendingUp,
};

export function TargetPersonasSection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.targetPersonas.headline}
          </h2>
          <p className="text-xl text-muted-foreground">
            {MESSAGING.targetPersonas.subheadline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MESSAGING.targetPersonas.personas.map((persona) => {
            const IconComponent = iconMap[persona.icon as keyof typeof iconMap];
            return (
              <Card
                key={persona.title}
                className="border-2 border-border bg-card shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]"
              >
                <CardHeader>
                  <IconComponent className="size-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">{persona.title}</CardTitle>
                  <CardDescription className="text-base">
                    {persona.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {persona.useCases.map((useCase) => (
                      <li
                        key={useCase}
                        className="flex items-start gap-2 text-foreground"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
