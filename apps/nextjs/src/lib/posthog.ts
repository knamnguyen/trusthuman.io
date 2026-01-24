"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { posthog } from "posthog-js";

export function PosthogIdentifier() {
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    posthog.identify(user.id, {
      email: user.primaryEmailAddress,
    });
  }, [user]);

  return null;
}
