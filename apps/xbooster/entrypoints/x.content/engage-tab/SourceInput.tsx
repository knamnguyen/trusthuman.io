import { useState } from "react";
import { List, Plus, Users, X } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useEngageSourcesStore } from "./stores/engage-sources-store";
import { parseSourceUrl } from "./utils/parse-source-url";

export function SourceInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { sources, selectedIds, addSource, removeSource, toggleSelected } =
    useEngageSourcesStore();

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Validate URL format first
    const parsed = parseSourceUrl(trimmed);
    if (!parsed) {
      setError("Invalid URL. Use an X list or community URL.");
      return;
    }

    // Try adding (returns null if duplicate)
    const result = addSource(trimmed);
    if (!result) {
      setError("This source is already added.");
      return;
    }

    setUrl("");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="space-y-2">
      {/* URL input row */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste list or community URL..."
          className="h-7 flex-1 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {/* Validation error */}
      {error && <p className="text-[10px] text-destructive">{error}</p>}

      {/* Hint */}
      {sources.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Click to select which sources to fetch.{" "}
          {hasSelection
            ? `${selectedIds.length} of ${sources.length} selected`
            : "None selected = fetch all"}
        </p>
      )}

      {/* Source chips */}
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sources.map((source) => {
            const isSelected = selectedIds.includes(source.id);
            return (
              <div
                key={source.id}
                className={[
                  "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : hasSelection
                      ? "border-border bg-muted/50 text-muted-foreground opacity-50"
                      : "border-border bg-muted text-foreground",
                ].join(" ")}
                onClick={() => toggleSelected(source.id)}
              >
                {source.type === "list" ? (
                  <List className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                <span>{source.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSource(source.id);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
