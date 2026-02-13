"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Input } from "@sassy/ui/input";

interface KeywordsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export function KeywordsInput({
  value,
  onChange,
  placeholder = "Add keyword...",
  maxItems = 20,
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !value.includes(trimmed) && value.length < maxItems) {
        onChange([...value, trimmed]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((keyword) => (
          <Badge
            key={keyword}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length >= maxItems ? `Max ${maxItems} items` : placeholder}
        disabled={value.length >= maxItems}
      />
      <p className="text-muted-foreground text-xs">
        Press Enter to add. {value.length}/{maxItems} keywords.
      </p>
    </div>
  );
}
