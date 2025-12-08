"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@sassy/ui/button";
import { LinkedInPreviewTool } from "./_components/linkedin-preview-tool";
import { GenerationList } from "./_components/generation-list";

export default function LinkedInPreviewPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-7xl py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">LinkedIn Post Previewer</h1>
          {!user ? (
            <SignInButton mode="modal">
              <Button>Sign in to Save</Button>
            </SignInButton>
          ) : (
            <div className="text-sm text-gray-600">Signed in as {user.firstName}</div>
          )}
        </div>
      </div>

      <LinkedInPreviewTool />

      {user && (
        <section className="container max-w-7xl py-16">
          <h2 className="mb-8 text-2xl font-bold">Your Saved Previews</h2>
          <GenerationList />
        </section>
      )}
    </div>
  );
}
