"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@sassy/ui/button";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sassy/ui/select";
import { toast } from "@sassy/ui/toast";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";
import type { DiscoverySet } from "./DiscoverySetCard";
import { IndustrySelector } from "./IndustrySelector";
import { KeywordsInput } from "./KeywordsInput";

function ToggleButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      onClick={onToggle}
      variant="primary"
      size="icon"
      className="z-10"
      aria-label={isOpen ? "Close panel" : "Open panel"}
      title={isOpen ? "Close panel" : "Open panel"}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}

const discoverySetFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  keywords: z.array(z.string()).default([]),
  keywordsMode: z.enum(["AND", "OR"]).default("OR"),
  excluded: z.array(z.string()).default([]),
  authorJobTitle: z.string().max(100).default(""),
  authorIndustries: z.array(z.string()).default([]),
});

type DiscoverySetFormData = z.infer<typeof discoverySetFormSchema>;

interface DiscoverySetSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: "create" | "edit" | null;
  selectedSet: DiscoverySet | null;
  onClose: () => void;
  onDelete: (set: DiscoverySet) => void;
}

export function DiscoverySetSidebar({
  isOpen,
  onToggle,
  mode,
  selectedSet,
  onClose,
  onDelete,
}: DiscoverySetSidebarProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<DiscoverySetFormData>({
    resolver: zodResolver(discoverySetFormSchema),
    defaultValues: {
      name: "",
      keywords: [],
      keywordsMode: "OR",
      excluded: [],
      authorJobTitle: "",
      authorIndustries: [],
    },
  });

  // Reset form when mode or selectedSet changes
  useEffect(() => {
    if (mode === "edit" && selectedSet) {
      reset({
        name: selectedSet.name,
        keywords: selectedSet.keywords,
        keywordsMode: selectedSet.keywordsMode as "AND" | "OR",
        excluded: selectedSet.excluded,
        authorJobTitle: selectedSet.authorJobTitle ?? "",
        authorIndustries: selectedSet.authorIndustries,
      });
    } else if (mode === "create") {
      reset({
        name: "",
        keywords: [],
        keywordsMode: "OR",
        excluded: [],
        authorJobTitle: "",
        authorIndustries: [],
      });
    }
  }, [mode, selectedSet, reset]);

  const createSet = useMutation(
    trpc.discoverySet.create.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Discovery set created successfully");
        onClose();
        await queryClient.invalidateQueries({
          queryKey: trpc.discoverySet.list.infiniteQueryKey(),
        });
      },
    }),
  );

  const updateSet = useMutation(
    trpc.discoverySet.update.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Discovery set updated successfully");
        onClose();
        await queryClient.invalidateQueries({
          queryKey: trpc.discoverySet.list.infiniteQueryKey(),
        });
      },
    }),
  );

  const onSubmit = (data: DiscoverySetFormData) => {
    const payload = {
      name: data.name,
      keywords: data.keywords,
      keywordsMode: data.keywordsMode,
      excluded: data.excluded,
      authorJobTitle: data.authorJobTitle || null,
      authorIndustries: data.authorIndustries,
    };

    if (mode === "create") {
      createSet.mutate(payload);
    } else if (mode === "edit" && selectedSet) {
      updateSet.mutate({ id: selectedSet.id, ...payload });
    }
  };

  const isPending = createSet.isPending || updateSet.isPending;

  return (
    <div
      className={cn(
        "bg-background relative flex shrink-0 flex-col border-l transition-all duration-200",
        isOpen ? "w-[400px]" : "w-0",
      )}
    >
      {/* Toggle button attached to left edge */}
      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={isOpen} onToggle={onToggle} />
      </div>

      {/* Sidebar content - only visible when open */}
      {isOpen && (
        <>
          {/* Header - fixed at top */}
          <div className="flex shrink-0 items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create Discovery Set" : "Edit Discovery Set"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form - scrollable content with fixed footer */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="name"
                        placeholder="Tech Founders"
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Controller
                  control={control}
                  name="keywords"
                  render={({ field }) => (
                    <KeywordsInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add keyword..."
                      maxItems={20}
                    />
                  )}
                />
              </div>

              {/* Keywords Mode */}
              <div className="space-y-2">
                <Label>Keyword Mode</Label>
                <Controller
                  control={control}
                  name="keywordsMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OR">Match ANY (OR)</SelectItem>
                        <SelectItem value="AND">Match ALL (AND)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  OR = Posts with any keyword. AND = Posts with all keywords.
                </p>
              </div>

              {/* Excluded Keywords */}
              <div className="space-y-2">
                <Label>Excluded Keywords</Label>
                <Controller
                  control={control}
                  name="excluded"
                  render={({ field }) => (
                    <KeywordsInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add excluded keyword..."
                      maxItems={10}
                    />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  Posts containing these keywords will be filtered out.
                </p>
              </div>

              {/* Author Job Title */}
              <div className="space-y-2">
                <Label htmlFor="authorJobTitle">Author Job Title</Label>
                <Controller
                  control={control}
                  name="authorJobTitle"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="authorJobTitle"
                        placeholder="CEO, Founder, CTO..."
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  Filter posts by author's job title.
                </p>
              </div>

              {/* Author Industries */}
              <div className="space-y-2">
                <Label>Author Industries</Label>
                <Controller
                  control={control}
                  name="authorIndustries"
                  render={({ field }) => (
                    <IndustrySelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select industries..."
                      maxItems={20}
                    />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  Filter posts by author's industry.
                </p>
              </div>
            </div>

            {/* Footer - fixed at bottom */}
            <div className="shrink-0 border-t p-4">
              <div className="flex gap-2">
                {mode === "edit" && selectedSet && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(selectedSet)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : mode === "create" ? (
                    <Plus className="mr-2 h-4 w-4" />
                  ) : null}
                  {mode === "create" ? "Create Discovery Set" : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
