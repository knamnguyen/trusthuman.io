"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

import { countries, countrySchema } from "@sassy/validators";

import { useTRPC } from "~/trpc/react";

const formSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim(),
  location: countrySchema,
});

export function SeatsList() {
  const trpc = useTRPC();
  const { data: linkedInAccounts } = useQuery({
    ...trpc.user.listLinkedInAccounts.queryOptions(),
  });
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

  const initAddAccountSession = useMutation(
    trpc.user.initAddAccountSession.mutationOptions(),
  );

  const status = useQuery(
    trpc.user.getLinkedInAccount.queryOptions(
      {
        accountId: initAddAccountSession.data?.accountId ?? "",
      },
      {
        enabled: initAddAccountSession.data !== undefined,
        refetchInterval(query) {
          return !query.state.data || query.state.data.status === "CONNECTING"
            ? 2000
            : false;
        },
        select: (data) => data?.status,
      },
    ),
  );

  const renderList = () => {
    if (linkedInAccounts === undefined) {
      return (
        <div className="grid place-items-center py-5">
          <LoaderCircleIcon className="animate-spin" />
        </div>
      );
    }
    if (linkedInAccounts.length === 0) {
      return (
        <div>
          <p>
            No LinkedIn accounts connected. Please connect an account to use
            browser mode.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {linkedInAccounts.map((account) => (
          <div
            key={account.id}
            className="rounded-lg border bg-white p-4 shadow"
          >
            <h2 className="mb-2 text-xl font-semibold">{account.email}</h2>
            <p className="mb-2">
              Status: {account.email ? "Active" : "Inactive"}
            </p>
            <p className="mb-2">
              Added at: {format(account.createdAt, "yyyy-MM-dd hh:mm:ssa")}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form
      className="mx-auto max-w-4xl py-10"
      onSubmit={handleSubmit((data) =>
        initAddAccountSession.mutate(data, {
          onSuccess: (data) => {
            window.open(data.liveUrl, "_blank", "noopener,noreferrer");
          },
        }),
      )}
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
          disabled={initAddAccountSession.data !== undefined}
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
        {status.data && <div>{status.data}</div>}
      </div>
      <div className="mt-4">{renderList()}</div>
    </form>
  );
}
