"use client";

import "@iframe-resizer/child";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";

import { AICommentDetectorTool } from "../_components/ai-comment-detector-tool";
import { SavedAnalysesList } from "../_components/saved-analyses-list";

export default function AICommentDetectEmbedPage() {
  const { user } = useUser();

  return (
    <div className="py-16">
      {user ? (
        <section className="container flex max-w-7xl flex-col items-center justify-center gap-2 text-center text-2xl font-bold">
          <h1 className="">Welcome to AI Comment Detector</h1>
          <p className="">
            {user.firstName} {user.lastName}
          </p>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="/engagekit-logo.svg" alt="EngageKit Logo" />
              <AvatarFallback>EK</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src={user.imageUrl} alt={user.firstName || "User"} />
              <AvatarFallback>
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </section>
      ) : (
        <section className="container flex max-w-7xl flex-col items-center justify-center gap-2 text-center text-2xl font-bold">
          <h1 className="">Welcome to AI Comment Detector, traveller.</h1>
          <p className="">
            Please sign in to save your analysis results and get shareable links.
          </p>
          <SignInButton mode="modal">
            <Button>Sign in to Save</Button>
          </SignInButton>
        </section>
      )}
      <AICommentDetectorTool />

      {user && (
        <section className="container max-w-7xl">
          <div className="rounded-lg border bg-card p-6">
            <SavedAnalysesList />
          </div>
        </section>
      )}
    </div>
  );
}
