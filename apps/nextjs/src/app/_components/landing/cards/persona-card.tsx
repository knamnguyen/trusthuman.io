import { Badge } from "@sassy/ui/badge";
import { Card, CardContent } from "@sassy/ui/card";

interface PersonaCardProps {
  icon: string;
  title: string;
  example: string;
  context: string;
  result: string;
}

export function PersonaCard({ title, example, context, result }: PersonaCardProps) {
  return (
    <Card className="border-2 border-border bg-card shadow-[4px_4px_0px_#000]">
      <CardContent className="p-6 space-y-3">
        <h4 className="text-lg font-bold text-foreground">{title}</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold text-foreground">Example:</span>{" "}
            <span className="text-muted-foreground">{example}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Context:</span>{" "}
            <span className="text-muted-foreground">{context}</span>
          </div>
          <div>
            <Badge variant="secondary" className="bg-secondary/20 text-secondary border border-secondary">
              {result}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
