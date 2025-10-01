"use client";

import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { LoaderCircleIcon } from "lucide-react";

import { useTRPC } from "~/trpc/react";

export function SeatsList() {
  const trpc = useTRPC();
  const { data: linkedInAccounts } = useQuery({
    ...trpc.user.listLinkedInAccounts.queryOptions(),
  });
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [twoFactorSecretKey, setTwoFactorSecretKey] = React.useState("");

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
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="mb-6 text-3xl font-bold">Added Seats</h1>

      <div className="space-x-2">
        <input
          className="border-2"
          value={email}
          placeholder="Linkedin Email"
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="border-2"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />
        <input
          className="border-2"
          value={twoFactorSecretKey}
          onChange={(e) => setTwoFactorSecretKey(e.target.value)}
          disabled={
            verifyTwoFactorSecretKey.isPending ||
            verifyTwoFactorSecretKey.data?.valid === true
          }
          placeholder="2FA Secret Key"
          type="text"
        />
        <input
          className="border-2"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="OTP from authenticator app"
          type="text"
        />
      </div>
      <button
        className="mt-4 cursor-pointer border border-gray-400 bg-gray-200 px-2"
        onClick={() => {
          const trimmed = twoFactorSecretKey.trim();
          if (trimmed === "") {
            return setError("2FA Secret Key is required");
          }
          if (otp.trim() === "") {
            return setError("OTP is required");
          }
          verifyTwoFactorSecretKey.mutate({
            twoFactorSecretKey: trimmed,
            otp,
          });
        }}
      >
        Verify 2FA Secret Key
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {verifyTwoFactorSecretKey.data?.valid && (
        <div>
          <p className="mt-2 text-green-600">
            Successfully verified two factor secret key.
          </p>
          <button
            className="mt-4 cursor-pointer border border-gray-400 bg-gray-200 px-2"
            onClick={() => {
              const trimmedEmail = email.trim();
              const trimmedPassword = password.trim();
              if (trimmedEmail === "" || trimmedPassword === "") {
                return setError("Email and password are required");
              }

              addSeat.mutate({
                email: trimmedEmail,
                password: trimmedPassword,
                twoFactorSecretKey: twoFactorSecretKey.trim(),
              });
            }}
          >
            Click here to confirm add seat
          </button>
        </div>
      )}
      <div className="mt-4">{renderList()}</div>
    </div>
  );
}
