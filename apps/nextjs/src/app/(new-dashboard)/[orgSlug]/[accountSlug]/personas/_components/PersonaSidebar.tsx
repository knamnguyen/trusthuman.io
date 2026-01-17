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
import { Slider } from "@sassy/ui/slider";
import { Textarea } from "@sassy/ui/textarea";
import { toast } from "@sassy/ui/toast";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";
import type { Persona } from "./PersonaCard";

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

// Comment length presets (maps to maxOutputTokens)
const COMMENT_LENGTH_PRESETS = {
  short: { value: 50, label: "Short", description: "1-2 sentences" },
  medium: { value: 150, label: "Medium", description: "2-3 sentences" },
  long: { value: 300, label: "Long", description: "3-5 sentences" },
} as const;

// Creativity level presets (maps to temperature)
const CREATIVITY_PRESETS = {
  conservative: { value: 0.3, label: "Conservative", description: "More predictable" },
  balanced: { value: 0.8, label: "Balanced", description: "Mix of creative & safe" },
  creative: { value: 1.2, label: "Creative", description: "More varied & unique" },
} as const;

const personaFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").default(""),
  content: z.string().min(1, "Instructions are required"),
  // AI Generation Config
  maxTokens: z.number().min(50).max(500).default(150),
  creativity: z.number().min(0).max(2).default(0.8),
});

type PersonaFormData = z.infer<typeof personaFormSchema>;

interface PersonaSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: "create" | "edit" | null;
  selectedPersona: Persona | null;
  onClose: () => void;
  onDelete: (persona: Persona) => void;
}

export function PersonaSidebar({
  isOpen,
  onToggle,
  mode,
  selectedPersona,
  onClose,
  onDelete,
}: PersonaSidebarProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<PersonaFormData>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "",
      maxTokens: 150,
      creativity: 0.8,
    },
  });

  // Reset form when mode or selectedPersona changes
  useEffect(() => {
    if (mode === "edit" && selectedPersona) {
      reset({
        name: selectedPersona.name,
        description: selectedPersona.description,
        content: selectedPersona.content,
        maxTokens: selectedPersona.maxTokens ?? 150,
        creativity: selectedPersona.creativity ?? 0.8,
      });
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        content: "",
        maxTokens: 150,
        creativity: 0.8,
      });
    }
  }, [mode, selectedPersona, reset]);

  const createPersona = useMutation(
    trpc.persona.commentStyle.create.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Persona created successfully");
        onClose();
        await queryClient.invalidateQueries({
          queryKey: trpc.persona.commentStyle.list.infiniteQueryKey(),
        });
      },
    })
  );

  const updatePersona = useMutation(
    trpc.persona.commentStyle.update.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Persona updated successfully");
        onClose();
        await queryClient.invalidateQueries({
          queryKey: trpc.persona.commentStyle.list.infiniteQueryKey(),
        });
      },
    })
  );

  const onSubmit = (data: PersonaFormData) => {
    const payload = {
      name: data.name,
      description: data.description ?? "",
      content: data.content,
      maxTokens: data.maxTokens,
      creativity: data.creativity,
    };

    if (mode === "create") {
      createPersona.mutate(payload);
    } else if (mode === "edit" && selectedPersona) {
      updatePersona.mutate({ id: selectedPersona.id, ...payload });
    }
  };

  const isPending = createPersona.isPending || updatePersona.isPending;

  return (
    <div
      className={cn(
        "bg-background relative flex h-full flex-col border-l transition-all duration-200",
        isOpen ? "w-[400px]" : "w-0"
      )}
    >
      {/* Toggle button attached to left edge */}
      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={isOpen} onToggle={onToggle} />
      </div>

      {/* Sidebar content - only visible when open */}
      {isOpen && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create Persona" : "Edit Persona"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <div className="flex-1 space-y-4 p-4">
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
                        placeholder="Tech enthusiast"
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="description"
                        rows={3}
                        placeholder="A tech enthusiast that loves to share insights about the latest trends in technology and innovation."
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
                  When auto-persona selection is enabled, this helps AI choose
                  the most appropriate persona for each comment.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Specific Instructions</Label>
                <Controller
                  control={control}
                  name="content"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="content"
                        rows={4}
                        placeholder="Talk about web based tech only, and avoid mobile apps. Avoid ego boasting and be humble."
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
                  Specific instructions to guide AI comment generation. Good for
                  placing guardrails or rules.
                </p>
              </div>

              {/* AI Generation Config Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">AI Generation Settings</h3>

                {/* Comment Length */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="maxTokens">Comment Length</Label>
                  <Controller
                    control={control}
                    name="maxTokens"
                    render={({ field }) => (
                      <Select
                        value={
                          field.value <= 75 ? "short" :
                          field.value <= 200 ? "medium" : "long"
                        }
                        onValueChange={(preset) => {
                          const value = COMMENT_LENGTH_PRESETS[preset as keyof typeof COMMENT_LENGTH_PRESETS]?.value ?? 150;
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMMENT_LENGTH_PRESETS).map(([key, preset]) => (
                            <SelectItem key={key} value={key}>
                              <span className="font-medium">{preset.label}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({preset.description})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    Controls how long the generated comments will be.
                  </p>
                </div>

                {/* Creativity Level */}
                <div className="space-y-2">
                  <Label htmlFor="creativity">Creativity Level</Label>
                  <Controller
                    control={control}
                    name="creativity"
                    render={({ field }) => (
                      <Select
                        value={
                          field.value <= 0.5 ? "conservative" :
                          field.value <= 1.0 ? "balanced" : "creative"
                        }
                        onValueChange={(preset) => {
                          const value = CREATIVITY_PRESETS[preset as keyof typeof CREATIVITY_PRESETS]?.value ?? 0.8;
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select creativity" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CREATIVITY_PRESETS).map(([key, preset]) => (
                            <SelectItem key={key} value={key}>
                              <span className="font-medium">{preset.label}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({preset.description})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    Higher creativity produces more varied and unique comments.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                {mode === "edit" && selectedPersona && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(selectedPersona)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : mode === "create" ? (
                    <Plus className="mr-2 h-4 w-4" />
                  ) : null}
                  {mode === "create" ? "Create Persona" : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
