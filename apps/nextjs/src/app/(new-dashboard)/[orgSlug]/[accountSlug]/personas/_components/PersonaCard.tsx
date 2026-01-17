"use client";

import { User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface Persona {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: Date;
  // AI Generation Config
  maxTokens: number | null;
  creativity: number | null;
}

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function PersonaCard({
  persona,
  isSelected,
  onSelect,
}: PersonaCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-primary ring-2"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <User className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm font-medium">
              {persona.name}
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Created {shortDateFormatter.format(persona.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {persona.description && (
          <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
            {persona.description}
          </p>
        )}
        {persona.content && (
          <p className="bg-muted line-clamp-2 rounded p-2 text-xs">
            {persona.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
