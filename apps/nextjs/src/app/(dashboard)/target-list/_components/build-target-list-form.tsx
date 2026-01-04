"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sassy/ui/select";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";

export const formStateSchema = z.object({
  searchQuery: z.string().trim().min(1),
  locations: z.array(z.string().trim().min(1)).min(1),
  currentCompanies: z.array(z.string()).optional(),
  pastCompanies: z.array(z.string()).optional(),
  schools: z.array(z.string()).optional(),
  currentJobTitles: z.array(z.string()).optional(),
  pastJobTitles: z.array(z.string()).optional(),
  yearsOfExperienceIds: z.array(z.number()).optional(),
  yearsAtCurrencyCompanyIds: z.array(z.number()).optional(),
  seniorityLevelIds: z.array(z.number()).optional(),
  functionIds: z.array(z.number()).optional(),
  industryIds: z.array(z.number()).optional(),
  firstName: z.array(z.string()).optional(),
  lastName: z.array(z.string()).optional(),
  profileLanguages: z.array(z.string()).optional(),
  recentlyChangesJobs: z.boolean().optional(),
});

export type FormState = z.infer<typeof formStateSchema>;

export const useBuildTargetListForm = () => useFormContext<FormState>();

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

export function BuildTargetListFormProvider({
  children,
  defaultValues,
}: {
  children: ReactNode;
  defaultValues?: Partial<FormState>;
}) {
  const form = useForm<FormState>({
    resolver: zodResolver(formStateSchema),
    defaultValues: {
      searchQuery: "",
      locations: [],
      currentCompanies: [],
      pastCompanies: [],
      schools: [],
      currentJobTitles: [],
      pastJobTitles: [],
      yearsOfExperienceIds: [],
      yearsAtCurrencyCompanyIds: [],
      seniorityLevelIds: [],
      functionIds: [],
      industryIds: [],
      firstName: [],
      lastName: [],
      profileLanguages: [],
      recentlyChangesJobs: false,
      ...defaultValues,
    },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}

// Helper component for array string inputs (tag input)
function ArrayStringInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim()}
            className="px-4"
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

// Flatten industries from infinite query
interface Industry {
  id: string;
  label: string;
  hierarchy: string;
  description: string;
}

export function BuildTargetListForm() {
  const { control } = useBuildTargetListForm();
  const trpc = useTRPC();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [open, setOpen] = useState(false);

  // Use infinite query for list when query is empty
  const industries = useInfiniteQuery(
    trpc.targetList.industries.list.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (_, pages) => {
          let offset = 0;
          for (const page of pages) {
            offset += page.length;
          }
          return offset === 0 ? undefined : offset;
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="p-4"
    >
      {/* Search Query (required) */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Search Query <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="searchQuery"
          render={({ field: { value, onChange, ...rest } }) => (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              {...rest}
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Keywords to search for in profiles
        </p>
      </div>

      {/* Locations (required) */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Locations <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="locations"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value}
              onChange={onChange}
              placeholder="e.g., San Francisco, New York"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          At least one location is required
        </p>
      </div>

      {/* First Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          First Name
        </label>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., John, Jane"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by first names (comma-separated)
        </p>
      </div>

      {/* Last Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <Controller
          control={control}
          name="lastName"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Smith, Doe"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by last names (comma-separated)
        </p>
      </div>

      {/* Current Companies */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Current Companies
        </label>
        <Controller
          control={control}
          name="currentCompanies"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Google, Microsoft"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by current company names
        </p>
      </div>

      {/* Past Companies */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Past Companies
        </label>
        <Controller
          control={control}
          name="pastCompanies"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Amazon, Apple"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by past company names
        </p>
      </div>

      {/* Schools */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Schools
        </label>
        <Controller
          control={control}
          name="schools"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Stanford, MIT"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">Filter by school names</p>
      </div>

      {/* Current Job Titles */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Current Job Titles
        </label>
        <Controller
          control={control}
          name="currentJobTitles"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Software Engineer, Product Manager"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by current job titles
        </p>
      </div>

      {/* Past Job Titles */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Past Job Titles
        </label>
        <Controller
          control={control}
          name="pastJobTitles"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., Intern, Junior Developer"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">Filter by past job titles</p>
      </div>

      {/* Industries */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Industries
        </label>
        <Controller
          control={control}
          name="industryIds"
          render={({ field: { value, onChange } }) => {
            const selectedIds = value ?? [];
            return (
              <>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                    >
                      <span className="truncate">
                        {query
                          ? `Searching "${query}"...`
                          : "Select an industry"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search industries..."
                        value={query}
                        onValueChange={setQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {debouncedQuery === ""
                            ? "No industries found."
                            : "No industries found. Try a different search."}
                        </CommandEmpty>
                        <CommandGroup>
                          {allIndustries
                            .filter(
                              (industry) =>
                                !selectedIds.includes(
                                  parseInt(industry.id, 10),
                                ),
                            )
                            .map((industry) => (
                              <CommandItem
                                key={industry.id}
                                value={industry.id}
                                onSelect={() => {
                                  const numVal = parseInt(industry.id, 10);
                                  if (
                                    !isNaN(numVal) &&
                                    !selectedIds.includes(numVal)
                                  ) {
                                    onChange([...selectedIds, numVal]);
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedIds.includes(
                                      parseInt(industry.id, 10),
                                    )
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="truncate">
                                  {industry.label}
                                </span>
                              </CommandItem>
                            ))}
                          {debouncedQuery === "" &&
                            industries.hasNextPage &&
                            !industries.isFetchingNextPage && (
                              <CommandItem
                                onSelect={() => {
                                  void industries.fetchNextPage();
                                }}
                                className="cursor-pointer"
                              >
                                Load more...
                              </CommandItem>
                            )}
                          {debouncedQuery === "" &&
                            industries.isFetchingNextPage && (
                              <CommandItem disabled>
                                Loading more...
                              </CommandItem>
                            )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const industry = allIndustries.find(
                        (ind) => parseInt(ind.id, 10) === id,
                      );
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {industry?.label ?? `Industry ${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              onChange(selectedIds.filter((i) => i !== id));
                            }}
                            className="hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        />
        <p className="mt-1 text-xs text-gray-500">Filter by industries</p>
      </div>

      {/* Profile Languages */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Profile Languages
        </label>
        <Controller
          control={control}
          name="profileLanguages"
          render={({ field: { value, onChange } }) => (
            <ArrayStringInput
              value={value ?? []}
              onChange={onChange}
              placeholder="e.g., English, Spanish"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by profile languages
        </p>
      </div>

      {/* Recently Changed Jobs */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="recentlyChangesJobs"
            render={({ field: { value, onChange, ...rest } }) => (
              <input
                type="checkbox"
                id="recentlyChangesJobs"
                checked={value ?? false}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...rest}
              />
            )}
          />
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="recentlyChangesJobs"
          >
            Recently Changed Jobs
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Filter for profiles that recently changed jobs
        </p>
      </div>

      {/* Years of Experience */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Years of Experience
        </label>
        <Controller
          control={control}
          name="yearsOfExperienceIds"
          render={({ field: { value, onChange } }) => {
            const selectedIds = value ?? [];
            // Common years of experience ranges (can be customized)
            const experienceRanges = [
              { id: 1, label: "0-1 years" },
              { id: 2, label: "2-5 years" },
              { id: 3, label: "6-10 years" },
              { id: 4, label: "11-15 years" },
              { id: 5, label: "16+ years" },
            ];
            return (
              <>
                <Select
                  value=""
                  onValueChange={(val) => {
                    const numVal = parseInt(val, 10);
                    if (!isNaN(numVal) && !selectedIds.includes(numVal)) {
                      onChange([...selectedIds, numVal]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none">
                    <SelectValue placeholder="Select years of experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {experienceRanges
                        .filter((range) => !selectedIds.includes(range.id))
                        .map((range) => (
                          <SelectItem
                            key={range.id}
                            value={range.id.toString()}
                            className="truncate"
                          >
                            {range.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const range = experienceRanges.find((r) => r.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {range?.label ?? `Range ${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              onChange(selectedIds.filter((i) => i !== id));
                            }}
                            className="hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by years of experience
        </p>
      </div>

      {/* Years at Current Company */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Years at Current Company
        </label>
        <Controller
          control={control}
          name="yearsAtCurrencyCompanyIds"
          render={({ field: { value, onChange } }) => {
            const selectedIds = value ?? [];
            const companyYearsRanges = [
              { id: 1, label: "0-1 years" },
              { id: 2, label: "2-5 years" },
              { id: 3, label: "6-10 years" },
              { id: 4, label: "11+ years" },
            ];
            return (
              <>
                <Select
                  value=""
                  onValueChange={(val) => {
                    const numVal = parseInt(val, 10);
                    if (!isNaN(numVal) && !selectedIds.includes(numVal)) {
                      onChange([...selectedIds, numVal]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none">
                    <SelectValue placeholder="Select years at current company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companyYearsRanges
                        .filter((range) => !selectedIds.includes(range.id))
                        .map((range) => (
                          <SelectItem
                            key={range.id}
                            value={range.id.toString()}
                            className="truncate"
                          >
                            {range.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const range = companyYearsRanges.find((r) => r.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {range?.label ?? `Range ${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              onChange(selectedIds.filter((i) => i !== id));
                            }}
                            className="hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        />
        <p className="mt-1 text-xs text-gray-500">
          Filter by years at current company
        </p>
      </div>

      {/* Seniority Levels */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Seniority Levels
        </label>
        <Controller
          control={control}
          name="seniorityLevelIds"
          render={({ field: { value, onChange } }) => {
            const selectedIds = value ?? [];
            const seniorityLevels = [
              { id: 1, label: "Intern" },
              { id: 2, label: "Entry Level" },
              { id: 3, label: "Associate" },
              { id: 4, label: "Mid-Senior Level" },
              { id: 5, label: "Director" },
              { id: 6, label: "Executive" },
            ];
            return (
              <>
                <Select
                  value=""
                  onValueChange={(val) => {
                    const numVal = parseInt(val, 10);
                    if (!isNaN(numVal) && !selectedIds.includes(numVal)) {
                      onChange([...selectedIds, numVal]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none">
                    <SelectValue placeholder="Select seniority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {seniorityLevels
                        .filter((level) => !selectedIds.includes(level.id))
                        .map((level) => (
                          <SelectItem
                            key={level.id}
                            value={level.id.toString()}
                            className="truncate"
                          >
                            {level.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const level = seniorityLevels.find((l) => l.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {level?.label ?? `Level ${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              onChange(selectedIds.filter((i) => i !== id));
                            }}
                            className="hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        />
        <p className="mt-1 text-xs text-gray-500">Filter by seniority levels</p>
      </div>

      {/* Functions */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Functions
        </label>
        <Controller
          control={control}
          name="functionIds"
          render={({ field: { value, onChange } }) => {
            const selectedIds = value ?? [];
            const functions = [
              { id: 1, label: "Engineering" },
              { id: 2, label: "Product" },
              { id: 3, label: "Design" },
              { id: 4, label: "Marketing" },
              { id: 5, label: "Sales" },
              { id: 6, label: "Operations" },
              { id: 7, label: "Finance" },
              { id: 8, label: "HR" },
            ];
            return (
              <>
                <Select
                  value=""
                  onValueChange={(val) => {
                    const numVal = parseInt(val, 10);
                    if (!isNaN(numVal) && !selectedIds.includes(numVal)) {
                      onChange([...selectedIds, numVal]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none">
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {functions
                        .filter((func) => !selectedIds.includes(func.id))
                        .map((func) => (
                          <SelectItem
                            key={func.id}
                            value={func.id.toString()}
                            className="truncate"
                          >
                            {func.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const func = functions.find((f) => f.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {func?.label ?? `Function ${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              onChange(selectedIds.filter((i) => i !== id));
                            }}
                            className="hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        />
        <p className="mt-1 text-xs text-gray-500">Filter by job functions</p>
      </div>
    </form>
  );
}
