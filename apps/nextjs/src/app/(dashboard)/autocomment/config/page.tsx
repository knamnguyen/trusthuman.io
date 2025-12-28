"use client";

import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useCurrentLinkedInAccountId } from "~/stores/linkedin-account-store";
import { useTRPC } from "~/trpc/react";
import {
  AutoCommentConfigurationForm,
  AutoCommentConfigurationFormHeader,
  AutoCommentConfigurationFormProvider,
} from "../_components/autocomment-configuration-form";

function replaceNullWithUndefined<T extends Record<string, unknown>>(
  obj: T,
): {
  [K in keyof T]: Exclude<T[K], null> | undefined;
} {
  // @ts-expect-error typescript is wrongly unhappy about this, but it works at runtime
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === null ? undefined : value,
    ]),
  ) as {
    [K in keyof T]: T[K] extends null ? Exclude<T[K], null> | undefined : T[K];
  };
}

export function AutoCommentConfigurationPage() {
  const accountId = useCurrentLinkedInAccountId();

  const trpc = useTRPC();

  const config = useQuery(
    trpc.autocomment.configuration.load.queryOptions(
      {
        linkedInAccountId: accountId ?? "",
      },
      {
        enabled: accountId !== null,
      },
    ),
  );

  if (accountId === null) {
    return redirect("/seats");
  }

  return (
    <div>
      <AutoCommentConfigurationFormProvider
        defaultValues={
          config.data ? replaceNullWithUndefined(config.data) : undefined
        }
      >
        <AutoCommentConfigurationFormHeader />
        {/* <StartAutoCommentModal */}
        {/*   trigger={<Button variant="outline">Start Auto Commenting</Button>} */}
        {/* /> */}
        <AutoCommentConfigurationForm />
      </AutoCommentConfigurationFormProvider>
    </div>
  );
}

export default AutoCommentConfigurationPage;
