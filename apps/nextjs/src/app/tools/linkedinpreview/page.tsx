"use client";

import Image from "next/image";
import { SignInButton, useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";

import { GenerationList } from "./_components/generation-list";
import { LinkedInPreviewTool } from "./_components/linkedin-preview-tool";
import LinkedInPreviewEmbedPage from "./embed/page";

export default function LinkedInPreviewPage() {
  const { user } = useUser();

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 border-b">
        <div className="container flex max-w-7xl items-center justify-between py-4">
          <h1 className="text-xl font-bold">LinkedIn Post Previewer</h1>
          {!user ? (
            <SignInButton mode="modal">
              <Button>Sign in to Save</Button>
            </SignInButton>
          ) : (
            <div className="text-sm">Signed in as {user.firstName}</div>
          )}
        </div>
      </div>
      <LinkedInPreviewEmbedPage />
    </div>
  );
}
