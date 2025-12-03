"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

import type { CountrySchema } from "@sassy/validators";
import { Dialog, DialogContent } from "@sassy/ui/dialog";
import { countries, countrySchema } from "@sassy/validators";

import { BrowserLiveviewDialog } from "~/_components/liveview-dialog";
import { trpcStandalone, useTRPC } from "~/trpc/react";

const formSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim(),
  location: countrySchema,
});

function AddSeatPage() {
  const trpc = useTRPC();

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
    useState<
      | "signed_in"
      | "initialized"
      | "failed_to_sign_in"
      | "failed_to_initialize_session"
      | null
    >(null);

  const [accountId, setAccountId] = useState<string | null>(null);

  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const initAddAccountSession = useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      location: CountrySchema;
    }) => {
      for await (const status of await trpcStandalone.account.init.create.mutate(
        input,
      )) {
        if (status.status === "error") {
          setInitAddAccountSessionStatus("failed_to_initialize_session");
          return;
        }
        if (status.status === "initialized") {
          setLiveUrl(status.liveUrl);
        }
        setInitAddAccountSessionStatus(status.status);
      }
    },
  });

  const destroySession = useMutation(
    trpc.account.init.destroy.mutationOptions(),
  );

  useEffect(() => {
    if (initAddAccountSessionStatus === "signed_in") {
      setLiveUrl(null);
    }
  }, [initAddAccountSessionStatus]);

  const status = useQuery(
    trpc.account.get.queryOptions(
      {
        id: accountId ?? "",
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

  return (
    <>
      <BrowserLiveviewDialog
        open={liveUrl !== null}
        onClose={() => {
          if (accountId === null) return;
          destroySession.mutate({ accountId });
          setAccountId(null);
          setLiveUrl(null);
          setInitAddAccountSessionStatus(null);
        }}
        liveUrl={liveUrl}
      />
      <form
        className="mx-auto max-w-4xl py-10"
        onSubmit={handleSubmit((data) => initAddAccountSession.mutate(data))}
      >
        <h1 className="mb-6 text-3xl font-bold">Add Seats</h1>

        <div className="flex flex-wrap gap-2">
          <input
            className="border-2"
            placeholder="Linkedin Email"
            required
            {...register("email")}
            autoComplete="email"
          />
          <input
            className="border-2"
            placeholder="Name"
            required
            {...register("name")}
            autoComplete="none"
          />
          <label htmlFor="location" className="inline-block border-2">
            Location:
            <select
              {...register("location")}
              id="location"
              className="outline-none"
            >
              {Object.entries(countries).map(([code, country]) => (
                <option key={code} value={code}>
                  {country}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-destructive mt-2">
          {Object.keys(errors).length > 0 &&
            JSON.stringify(
              {
                location: errors.location?.message,
                name: errors.name?.message,
                email: errors.email?.message,
              },
              null,
              2,
            )}
        </p>
        <div className="space-x-2">
          <button
            disabled={initAddAccountSessionStatus !== null}
            className="mt-4 cursor-pointer border border-gray-400 bg-gray-200 px-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Verify your 2FA Secret Key before adding a seat"
            type="submit"
          >
            {initAddAccountSession.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Initiate add seat"
            )}
          </button>
          {initAddAccountSessionStatus && (
            <div>{initAddAccountSessionStatus}</div>
          )}
        </div>
      </form>
    </>
  );
}

export default AddSeatPage;
