"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { EditIcon, LoaderIcon, TrashIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sassy/ui/table";
import { toast } from "@sassy/ui/toast";

import { useTRPC } from "~/trpc/react";

export default function PersonasPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const [createCommentStyleModalOpen, setCreateCommentStyleModalOpen] =
    useState(false);

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Personas</h1>
        <p className="mb-6 text-gray-600">AI personas for {accountSlug}</p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-end justify-between">
              <div className="space-y-1">
                <div>AI Personas</div>
                <CardDescription className="font-normal">
                  Custom personas for engagement style
                </CardDescription>
              </div>
              <Button onClick={() => setCreateCommentStyleModalOpen(true)}>
                Create Persona
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ManageCommentStyle
              createCommentStyleModalOpen={createCommentStyleModalOpen}
              setCreateCommentStyleModalOpen={setCreateCommentStyleModalOpen}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function ManageCommentStyle({
  createCommentStyleModalOpen,
  setCreateCommentStyleModalOpen,
}: {
  createCommentStyleModalOpen: boolean;
  setCreateCommentStyleModalOpen: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const [page, setPage] = useState(0);

  const [commentStyleToEdit, setCommentStyleToEdit] = useState<{
    id: string;
    name: string;
    description: string;
    content: string;
  } | null>(null);

  const [styleToDelete, setStyleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const commentStyles = useInfiniteQuery(
    trpc.persona.commentStyle.list.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const currentPageCommentStyles = useMemo(() => {
    return commentStyles.data?.pages[page]?.data ?? [];
  }, [commentStyles.data, page]);

  if (!commentStyles.data?.pages) {
    return <div>No personas found</div>;
  }

  function renderTableBody() {
    if (commentStyles.isFetching)
      return (
        <TableRow>
          <TableCell colSpan={3}>
            <LoaderIcon className="mx-auto animate-spin" />
          </TableCell>
        </TableRow>
      );

    if (currentPageCommentStyles.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3}>
            <div className="grid place-items-center py-2 text-gray-500">
              <div className="my-3">No personas found</div>
              <Button
                onClick={() => setCreateCommentStyleModalOpen(true)}
                size="sm"
              >
                Create your first
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return currentPageCommentStyles.map((style) => (
      <TableRow key={style.id}>
        <TableCell className="w-10">
          <div className="flex items-center gap-x-1">
            <button onClick={() => setCommentStyleToEdit(style)}>
              <EditIcon className="h-4 w-4 text-orange-500" />
            </button>
            <button onClick={() => setStyleToDelete(style)}>
              {/* add confirmation dialog */}
              <TrashIcon className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </TableCell>
        <TableCell>{style.name}</TableCell>
        <TableCell className="text-right">
          {shortDateFormatter.format(style.createdAt)}
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div>
      <CreateCommentStyleModal
        open={createCommentStyleModalOpen}
        onClose={() => setCreateCommentStyleModalOpen(false)}
      />
      <UpdateCommentStyleModal
        style={commentStyleToEdit}
        onClose={() => setCommentStyleToEdit(null)}
      />
      <DeleteStyleConfirmationDialog
        styleToDelete={styleToDelete}
        onClose={() => setStyleToDelete(null)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderTableBody()}</TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-end gap-x-4">
        <Button
          onClick={() => {
            void commentStyles.fetchPreviousPage();
            setPage((page) => Math.max(0, page - 1));
          }}
          disabled={
            !commentStyles.hasPreviousPage ||
            commentStyles.isFetchingPreviousPage
          }
          variant="outline"
        >
          Previous
        </Button>

        <span className="text-sm text-gray-600">Page {page}</span>

        <Button
          onClick={() => {
            void commentStyles.fetchNextPage();
            setPage((page) => page + 1);
          }}
          disabled={
            !commentStyles.hasNextPage || commentStyles.isFetchingNextPage
          }
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

const createCommentStyleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  content: z.string().min(1, "Content is required"),
});

function CreateCommentStyleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();

  const {
    handleSubmit,
    control,
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(createCommentStyleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "",
    },
  });

  const queryClient = useQueryClient();

  const createCommentStyle = useMutation(
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
    }),
  );

  useEffect(() => {
    if (open === false) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={(v) => v === false && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Persona</DialogTitle>
          <DialogDescription>
            A comment style can be used to customize the tone and style of
            AI-assisted comment generation.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => createCommentStyle.mutate(data))}
        >
          <div className="mt-4">
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name of your persona
              </label>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, ...rest } }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Tech enthusiast"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
            </div>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description of your persona
              </label>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, ...rest } }) => (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="A tech enthusiast that loves to share insights about the latest trends in technology and innovation."
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
              <p className="-mt-1 pl-0.5 text-xs text-gray-500">
                When auto-persona selection is enabled, this description will
                help Engagekit AI choose the most appropriate persona for each
                comment.
              </p>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Specific Instructions
              </label>
              <Controller
                control={control}
                name="content"
                render={({ field: { value, onChange, ...rest } }) => (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Talk about web based tech only, and avoid mobile apps. Avoid ego boasting and be humble."
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
              <p className="-mt-1 pl-0.5 text-xs text-gray-500">
                Specific instructions to guide Engagekit AI to generate
                comments. Good for placing guardrails or rules.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={createCommentStyle.isPending} type="submit">
              {createCommentStyle.isPending ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                "Create Persona"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateCommentStyleModal({
  style,
  onClose,
}: {
  style: {
    id: string;
    name: string;
    description: string;
    content: string;
  } | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createCommentStyleFormSchema),
    values: {
      name: style?.name ?? "",
      description: style?.description ?? "",
      content: style?.content ?? "",
    },
  });

  const queryClient = useQueryClient();

  const updateCommentStyle = useMutation(
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
    }),
  );

  return (
    <Dialog
      open={style !== null}
      onOpenChange={(v) => v === false && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Persona</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => {
            if (style == null) return;
            updateCommentStyle.mutate({ id: style.id, ...data });
          })}
        >
          <div className="mt-4">
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name of your persona
              </label>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, ...rest } }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Tech enthusiast"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
            </div>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description of your persona
              </label>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, ...rest } }) => (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="A tech enthusiast that loves to share insights about the latest trends in technology and innovation."
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
              <p className="-mt-1 pl-0.5 text-xs text-gray-500">
                When auto-persona selection is enabled, this description will
                help Engagekit AI choose the most appropriate persona for each
                comment.
              </p>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Specific Instructions
              </label>
              <Controller
                control={control}
                name="content"
                render={({ field: { value, onChange, ...rest } }) => (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Talk about web based tech only, and avoid mobile apps. Avoid ego boasting and be humble."
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                )}
              />
              <p className="-mt-1 pl-0.5 text-xs text-gray-500">
                Specific instructions to guide Engagekit AI to generate
                comments. Good for placing guardrails or rules.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={updateCommentStyle.isPending} type="submit">
              {updateCommentStyle.isPending ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                "Update Persona"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStyleConfirmationDialog({
  styleToDelete,
  onClose,
}: {
  styleToDelete: {
    id: string;
    name: string;
  } | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteCommentStyle = useMutation(
    trpc.persona.commentStyle.delete.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Persona deleted successfully");
        onClose();
        void queryClient.invalidateQueries({
          queryKey: trpc.persona.commentStyle.list.infiniteQueryKey(),
        });
      },
    }),
  );
  return (
    <Dialog
      open={styleToDelete !== null}
      onOpenChange={(v) => v === false && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete {styleToDelete?.name}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            persona.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={deleteCommentStyle.isPending}
            onClick={() => {
              if (styleToDelete == null) return;
              deleteCommentStyle.mutate({ id: styleToDelete.id });
            }}
          >
            {deleteCommentStyle.isPending ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
