"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";
import { PreviewPanel } from "../_components/preview-panel";

export default function SharedPreviewPage() {
  const params = useParams<{ id: string }>();
  const trpc = useTRPC();

  const {
    data: generation,
    isLoading,
    error,
  } = useQuery({
    ...trpc.linkedInPreview.getById.queryOptions({ id: params.id }),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container max-w-4xl text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold">Preview Not Found</h1>
          <p className="mb-6 text-gray-600">
            The preview you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="https://blog.engagekit.io/linkedin-post-previewer/">
            <Button>Create Your Own</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold">LinkedIn Post Preview</h1>
          <p className="mb-6 text-gray-600">
            Created by {generation.user?.firstName} {generation.user?.lastName}
          </p>
          <Link href="https://blog.engagekit.io/linkedin-post-previewer/">
            <Button>Create Your Own</Button>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <PreviewPanel
            content={generation.contentJson}
            image={generation.s3Url}
          />
        </div>
      </div>
    </div>
  );
}
