"use client";

import { useParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

export default function PersonasPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Personas</h1>
        <p className="mb-6 text-gray-600">
          AI personas for {accountSlug}
        </p>

        <Card>
          <CardHeader>
            <CardTitle>AI Personas</CardTitle>
            <CardDescription>
              Custom personas for engagement style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Persona management coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
