"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@sassy/ui/button";
import { useTRPC } from "~/trpc/react";
import { PreviewPanel } from "../_components/preview-panel";

export default function SharedPreviewPage() {
  const params = useParams<{ id: string }>();
  const trpc = useTRPC();

  const { data: generation, isLoading, error } = useQuery({
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
          <h1 className="text-3xl font-bold mb-4">Preview Not Found</h1>
          <p className="text-gray-600 mb-6">
            The preview you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/tools/linkedinpreview">
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
          <h1 className="text-3xl font-bold mb-4">LinkedIn Post Preview</h1>
          <p className="text-gray-600 mb-6">
            Created by {generation.user?.firstName} {generation.user?.lastName}
          </p>
          <Link href="/tools/linkedinpreview">
            <Button>Create Your Own</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <PreviewPanel
            content={generation.contentJson}
            image={generation.s3Url}
          />
        </div>
      </div>
    </div>
  );
}
