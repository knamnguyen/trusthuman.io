import { CheckCircle2, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

import { MESSAGING } from "../landing-content";

export function ProblemSolutionSection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem Card */}
          <Card className="border-2 border-destructive bg-card shadow-[4px_4px_0px_#000]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-destructive">
                {MESSAGING.problemSolution.problem.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {MESSAGING.problemSolution.problem.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <X className="size-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Solution Card */}
          <Card className="border-2 border-secondary bg-card shadow-[4px_4px_0px_#000]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-secondary">
                {MESSAGING.problemSolution.solution.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {MESSAGING.problemSolution.solution.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
