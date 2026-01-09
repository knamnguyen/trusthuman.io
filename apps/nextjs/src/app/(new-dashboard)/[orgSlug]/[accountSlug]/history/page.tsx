"use client";

import { useParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

export default function HistoryPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">History</h1>
        <p className="mb-6 text-gray-600">
          Activity history for {accountSlug}
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Past actions and engagements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              History view coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
