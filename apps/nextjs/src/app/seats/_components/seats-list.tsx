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
  password: z.string().trim(),
  location: countrySchema,
  twoFactorSecretKey: z.string(),
  otp: z.string(),
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
    getValues,
    trigger,
  } = useForm<z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      location: undefined,
      twoFactorSecretKey: "",
      otp: "",
    },
  });

  const verifyTwoFactorSecretKey = useMutation(
    trpc.user.verifyTwoFactorSecretKey.mutationOptions(),
  );

  const addSeat = useMutation(trpc.user.addLinkedInAccount.mutationOptions());

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
      onSubmit={handleSubmit((data) => addSeat.mutate(data))}
    >
      <h1 className="mb-6 text-3xl font-bold">Add Seats</h1>

      <div className="space-x-2">
        <input
          className="border-2"
          placeholder="Linkedin Email"
          required
          {...register("email")}
          autoComplete="email"
        />
        <input
          className="border-2"
          placeholder="Password"
          required
          {...register("password")}
          type="password"
          autoComplete="current-password"
        />
        <input
          className="border-2"
          {...register("twoFactorSecretKey")}
          required
          disabled={
            verifyTwoFactorSecretKey.isPending ||
            verifyTwoFactorSecretKey.data?.valid === true
          }
          placeholder="2FA Secret Key"
          type="text"
        />
        <input
          className="border-2"
          required
          {...register("otp")}
          placeholder="OTP from authenticator app"
          type="text"
        />
        <label htmlFor="location">
          Location:
          <select {...register("location")} id="location">
            {Object.entries(countries).map(([code, country]) => (
              <option key={code} value={code}>
                {country}
              </option>
            ))}
          </select>
        </label>
      </div>
      {Object.keys(errors).length > 0 && JSON.stringify(errors, null, 2)}
      <button
        className="mt-4 cursor-pointer border border-gray-400 bg-gray-200 px-2"
        type="button"
        onClick={async () => {
          const valid = await trigger(["twoFactorSecretKey", "otp"]);
          if (!valid) {
            return;
          }

          const twoFactorSecretKey = getValues("twoFactorSecretKey");
          const otp = getValues("otp");
          verifyTwoFactorSecretKey.mutate({
            twoFactorSecretKey,
            otp,
          });
        }}
      >
        Verify 2FA Secret Key
      </button>
      {verifyTwoFactorSecretKey.data?.valid && (
        <div>
          <p className="mt-2 text-green-600">
            Successfully verified two factor secret key.
          </p>
          <button
            className="mt-4 cursor-pointer border border-gray-400 bg-gray-200 px-2"
            type="submit"
          >
            Click here to confirm add seat
          </button>
        </div>
      )}
      <div className="mt-4">{renderList()}</div>
    </form>
  );
}
