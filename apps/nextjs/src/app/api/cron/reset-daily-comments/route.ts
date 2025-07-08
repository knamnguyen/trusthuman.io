import type { NextRequest } from "next/server";

import { db } from "@sassy/db";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Job handler that resets the `dailyAIcomments` field
 * for every user in the database. This route is meant to be invoked
 * by Vercel's scheduled function once per day (see `vercel.json`).
 *
 * Security: Vercel automatically attaches the header
 *   Authorization: Bearer <CRON_SECRET>
 * when `CRON_SECRET` is configured in the project. We verify that
 * header to prevent public access.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedHeader) {
    console.warn("[reset-daily-comments] Unauthorized invocation", {
      received: authHeader,
    });
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[reset-daily-comments] Cron invocation started");

  try {
    const result = await db.user.updateMany({
      data: { dailyAIcomments: 0 },
    });

    console.log(
      `[reset-daily-comments] Reset completed. Users updated: ${result.count}`,
    );

    return Response.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("[reset-daily-comments] Error during reset", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
