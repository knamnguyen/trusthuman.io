"use client";

import * as React from "react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Label } from "@sassy/ui/label";
import { Textarea } from "@sassy/ui/textarea";
import { cn } from "@sassy/ui/utils";

interface ContentGuideFormProps {
  onGenerate: (contentGuide: string) => void;
  isGenerating?: boolean;
  className?: string;
}

const ContentGuideForm = React.forwardRef<
  HTMLDivElement,
  ContentGuideFormProps
>(({ onGenerate, isGenerating = false, className }, ref) => {
  const [contentGuide, setContentGuide] = React.useState("");
  const [characterCount, setCharacterCount] = React.useState(0);

  const maxCharacters = 500;

  const handleContentGuideChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    if (value.length <= maxCharacters) {
      setContentGuide(value);
      setCharacterCount(value.length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGenerating) {
      onGenerate(contentGuide.trim());
    }
  };

  const loadExampleGuide = () => {
    const example =
      "Focus on user interactions and app features. Show clear button clicks and immediate results. Make it actionable for viewers who want to try the app themselves. Keep it engaging and fast-paced.";
    setContentGuide(example);
    setCharacterCount(example.length);
  };

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Guide</CardTitle>
          <CardDescription>
            Provide guidance for how the viral video should be created. This
            helps our AI select the best parts of your demo and create engaging
            captions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-guide">Content Direction</Label>
              <Textarea
                id="content-guide"
                placeholder="e.g., Focus on user interactions and key features. Make it actionable and engaging for social media..."
                value={contentGuide}
                onChange={handleContentGuideChange}
                className="min-h-24 resize-none"
              />
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadExampleGuide}
                  className="hover:text-foreground h-auto p-0 text-xs"
                >
                  Load example
                </Button>
                <span
                  className={cn(
                    characterCount > maxCharacters * 0.9 && "text-yellow-600",
                    characterCount === maxCharacters && "text-destructive",
                  )}
                >
                  {characterCount}/{maxCharacters}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Viral Video...
                </>
              ) : (
                "Generate Viral Video"
              )}
            </Button>

            {contentGuide.length === 0 && (
              <p className="text-muted-foreground text-center text-xs">
                You can leave this empty for automatic content selection, or
                provide guidance for better results.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

ContentGuideForm.displayName = "ContentGuideForm";

export { ContentGuideForm };
