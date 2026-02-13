"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@sassy/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@sassy/ui/popover";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";

interface Industry {
  id: string;
  label: string;
  hierarchy: string;
  description: string;
}

interface IndustrySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function IndustrySelector({
  value,
  onChange,
  placeholder = "Select industries...",
  maxItems = 20,
}: IndustrySelectorProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  // Use infinite query for list when query is empty
  const PAGE_SIZE = 100;
  const industries = useInfiniteQuery(
    trpc.targetList.industries.list.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage, allPages) => {
          // If last page has fewer items than PAGE_SIZE, we've reached the end
          if (lastPage.length < PAGE_SIZE) {
            return undefined;
          }
          // Calculate total offset for next page
          let offset = 0;
          for (const page of allPages) {
            offset += page.length;
          }
          return offset;
        },
        enabled: debouncedQuery === "",
      },
    ),
  );

  // Use regular query for search when query is not empty
  const searchIndustries = useQuery(
    trpc.targetList.industries.search.queryOptions(
      {
        query: debouncedQuery,
      },
      {
        enabled: debouncedQuery !== "",
      },
    ),
  );

  const allIndustries: Industry[] =
    debouncedQuery === ""
      ? (industries.data?.pages.flat() ?? [])
      : (searchIndustries.data ?? []);

  // Infinite scroll: load more when scrolling near bottom
  const listRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    if (!listRef.current || debouncedQuery !== "") return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (industries.hasNextPage && !industries.isFetchingNextPage) {
        industries.fetchNextPage();
      }
    }
  }, [industries, debouncedQuery]);

  // Get selected industry details for display
  const selectedIndustries = useQuery(
    trpc.targetList.industries.list.queryOptions(
      { limit: 1000 },
      { enabled: value.length > 0 },
    ),
  );

  const selectedIndustryLabels = (selectedIndustries.data ?? [])
    .filter((ind) => value.includes(ind.id))
    .reduce(
      (acc, ind) => {
        acc[ind.id] = ind.label;
        return acc;
      },
      {} as Record<string, string>,
    );

  const toggleIndustry = (industryId: string) => {
    if (value.includes(industryId)) {
      onChange(value.filter((id) => id !== industryId));
    } else if (value.length < maxItems) {
      onChange([...value, industryId]);
    }
  };

  const removeIndustry = (industryId: string) => {
    onChange(value.filter((id) => id !== industryId));
  };

  return (
    <div className="space-y-2">
      {/* Selected Industries Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((industryId) => (
            <Badge key={industryId} variant="secondary" className="gap-1 pr-1">
              {selectedIndustryLabels[industryId] ?? industryId}
              <button
                type="button"
                onClick={() => removeIndustry(industryId)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={value.length >= maxItems}
          >
            {value.length >= maxItems
              ? `Max ${maxItems} industries`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search industries..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No industry found.</CommandEmpty>
              <CommandGroup>
                <div
                  ref={listRef}
                  onScroll={handleScroll}
                  className="max-h-[300px] overflow-y-auto"
                >
                  {allIndustries.map((industry) => (
                    <CommandItem
                      key={industry.id}
                      value={industry.id}
                      onSelect={() => toggleIndustry(industry.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(industry.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{industry.label}</span>
                        {industry.hierarchy !== industry.label && (
                          <span className="text-muted-foreground text-xs">
                            {industry.hierarchy}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                  {/* Loading indicator for infinite scroll */}
                  {industries.isFetchingNextPage && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-xs text-muted-foreground">
                        Loading more...
                      </span>
                    </div>
                  )}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-muted-foreground text-xs">
        {value.length}/{maxItems} industries selected.
      </p>
    </div>
  );
}
