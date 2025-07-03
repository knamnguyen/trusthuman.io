"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

/**
 * Page shown when checkout is canceled
 */
export default function SubscriptionCanceledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <CardTitle className="mt-4 text-2xl font-bold text-gray-800">
            Checkout Canceled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Your payment was not processed. You have not been charged.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="outline">
            <Link href="/subscription">Return to Subscription Page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
