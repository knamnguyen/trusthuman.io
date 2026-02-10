import { Card, CardContent } from "@sassy/ui/card";

interface StatCardProps {
  number: string;
  label: string;
  description: string;
  source: string;
}

export function StatCard({ number, label, description, source }: StatCardProps) {
  return (
    <Card className="border-2 border-border bg-card shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="text-6xl font-bold text-primary">{number}</div>
        <div className="text-xl font-semibold text-foreground">{label}</div>
        <div className="text-base text-foreground">{description}</div>
        <div className="mt-2 text-xs text-muted-foreground italic">{source}</div>
      </CardContent>
    </Card>
  );
}
