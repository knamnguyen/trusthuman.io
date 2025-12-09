"use client";

import "@iframe-resizer/child";

import Image from "next/image";
import { SignInButton, useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";

import { GenerationList } from "../_components/generation-list";
import { LinkedInPreviewTool } from "../_components/linkedin-preview-tool";

export default function LinkedInPreviewEmbedPage() {
  const { user } = useUser();

  return (
    <div className="py-16">
      {user ? (
        <section className="container flex max-w-7xl flex-col items-center justify-center gap-2 text-center text-2xl font-bold">
          {" "}
          <h1 className="">Welcome to LinkedIn Post Previewer</h1>
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
          <h1 className="">Welcome to LinkedIn Post Previewer, traveller.</h1>
          <p className="">
            Please sign in to save your previews and get a result link to share
            with your friends.
          </p>
          <SignInButton mode="redirect">
            <Button>Sign in to Save</Button>
          </SignInButton>
        </section>
      )}
      <LinkedInPreviewTool />

      {user ? (
        <section className="container max-w-7xl">
          <h2 className="mb-8 text-2xl font-bold">Your Saved Previews</h2>
          <GenerationList />
        </section>
      ) : (
        <section className="container max-w-7xl">
          <h2 className="mb-8 text-2xl font-bold">Your Saved Previews</h2>
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="">
              No saved previews - please sign in to save your previews and get a
              result link to share with your friends.
            </p>
            <SignInButton mode="redirect">
              <Button>Sign in to Save</Button>
            </SignInButton>
          </div>
        </section>
      )}
    </div>
  );
}
