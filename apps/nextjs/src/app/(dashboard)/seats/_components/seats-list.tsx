"use client";

import React, { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

import type { CountrySchema } from "@sassy/validators";
import { Dialog, DialogContent } from "@sassy/ui/dialog";
import { countries, countrySchema } from "@sassy/validators";

import { trpcStandalone, useTRPC } from "~/trpc/react";

const formSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim(),
  location: countrySchema,
});

export function SeatsList() {
  const trpc = useTRPC();
  const accountsQuery = useInfiniteQuery(
    trpc.user.listLinkedInAccounts.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      location: undefined,
    },
  });

  const [initAddAccountSessionStatus, setInitAddAccountSessionStatus] =
    useState<"signed_in" | "initialized" | "failed_to_sign_in" | null>(null);

  const [accountId, setAccountId] = useState<string | null>(null);

  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const initAddAccountSession = useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      location: CountrySchema;
    }) => {
      for await (const status of await trpcStandalone.user.initAddAccountSession.mutate(
        input,
      )) {
        if (status.status === "initialized") {
          setLiveUrl(status.liveUrl);
        }
        setInitAddAccountSessionStatus(status.status);
      }
    },
  });

  const destroySession = useMutation(
    trpc.user.destroyAddAccountSession.mutationOptions(),
  );

  const status = useQuery(
    trpc.user.getLinkedInAccount.queryOptions(
      {
        accountId: accountId ?? "",
      },
      {
        enabled: accountId !== null,
        refetchInterval(query) {
          return !query.state.data || query.state.data.status === "CONNECTING"
            ? 2000
            : false;
        },
        select: (data) => data?.status,
      },
    ),
  );

  const accounts = useMemo(
    () => accountsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [accountsQuery.data],
  );

  const renderList = () => {
    if (accountsQuery.isPending) {
      return (
        <div className="grid place-items-center py-5">
          <LoaderCircleIcon className="animate-spin" />
        </div>
      );
    }
    if (accounts.length === 0) {
      return (
        <div>
          <p>
            No LinkedIn accounts connected. Please connect an account to use
            browser mode.
          </p>
        </div>
      );
    }

    // TODO: add ability to edit current account's location
    return (
      <div className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-lg border bg-white p-4 shadow"
          >
            <h2 className="mb-2 text-xl font-semibold">{account.email}</h2>
            <p className="mb-2">Status: {account.status}</p>
            <p className="mb-2">Location: {account.location}</p>
            <p className="mb-2">
              Added at: {format(account.createdAt, "yyyy-MM-dd hh:mm:ssa")}
            </p>
            {account.status === "CONNECTING" ? (
              <button
                className="cursor-pointer border border-gray-400 bg-gray-200 px-2"
                type="button"
                onClick={() => {
                  setAccountId(account.id);
                  initAddAccountSession.mutate({
                    email: account.email,
                    name: account.name ?? "",
                    location: account.location as CountrySchema,
                  });
                }}
              >
                Continue initialization
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={liveUrl !== null}>
        {/* TODO: add alert dialog for button close */}
        <DialogContent
          className="h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] p-2"
          hideCloseIcon
        >
          <button
            className="absolute top-2 right-2 cursor-pointer"
            onClick={() => {
              if (accountId === null) return;
              destroySession.mutate({ accountId });
              setAccountId(null);
              setLiveUrl(null);
              setInitAddAccountSessionStatus(null);
            }}
          >
            <XIcon className="size-4" />
          </button>
          {liveUrl !== null && (
            <iframe
              src={liveUrl}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          )}
        </DialogContent>
      </Dialog>
      <div className="mx-4 my-2">{renderList()}</div>
    </>
  );
}
