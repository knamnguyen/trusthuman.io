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

const personaFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").default(""),
  content: z.string().min(1, "Instructions are required"),
  // AI Generation Config
  maxWords: z.number().min(1).max(300).default(100),
  creativity: z.number().min(0).max(2).default(1.0),
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
      maxWords: 100,
      creativity: 1.0,
    },
  });

  // Reset form when mode or selectedPersona changes
  useEffect(() => {
    if (mode === "edit" && selectedPersona) {
      reset({
        name: selectedPersona.name,
        description: selectedPersona.description,
        content: selectedPersona.content,
        maxWords: selectedPersona.maxWords ?? 100,
        creativity: selectedPersona.creativity ?? 1.0,
      });
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        content: "",
        maxWords: 100,
        creativity: 1.0,
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
      maxWords: data.maxWords,
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
        "bg-background relative flex shrink-0 flex-col border-l transition-all duration-200",
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
          {/* Header - fixed at top */}
          <div className="shrink-0 flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create Persona" : "Edit Persona"}
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
                <h3 className="text-sm font-medium mb-4">AI Generation Settings</h3>

                {/* Comment Length (Words) - Slider */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxWords">Comment Length</Label>
                    <Controller
                      control={control}
                      name="maxWords"
                      render={({ field }) => (
                        <span className="text-sm text-muted-foreground">
                          {field.value} words
                        </span>
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="maxWords"
                    render={({ field }) => (
                      <div className="pt-6">
                        <Slider
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          min={1}
                          max={300}
                          step={1}
                          aria-label="Comment length in words"
                        />
                      </div>
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    Maximum number of words for generated comments (1-300).
                  </p>
                </div>

                {/* Creativity Level - Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="creativity">Creativity Level</Label>
                    <Controller
                      control={control}
                      name="creativity"
                      render={({ field }) => (
                        <span className="text-sm text-muted-foreground">
                          {field.value.toFixed(1)}
                        </span>
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="creativity"
                    render={({ field }) => (
                      <div className="pt-6">
                        <Slider
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          min={0}
                          max={2}
                          step={0.1}
                          aria-label="Creativity level"
                        />
                      </div>
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    0 = Very predictable, 1 = Balanced, 2 = Very creative
                  </p>
                </div>
              </div>
            </div>

            {/* Footer - fixed at bottom */}
            <div className="shrink-0 border-t p-4">
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
