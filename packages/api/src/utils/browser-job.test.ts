import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { ulid } from "ulidx";

import type { PrismaClient } from "@sassy/db";
import { createTestPrismaClient } from "@sassy/db/client/test";

import { BrowserJobRegistry, BrowserJobWorker } from "./browser-job";
import { BrowserSessionRegistry, hyperbrowser } from "./browser-session";

let worker!: BrowserJobWorker;
let db!: PrismaClient;

beforeEach(async () => {
  db = await createTestPrismaClient();
  const browserRegistry = new BrowserSessionRegistry();
  worker = new BrowserJobWorker({
    hyperbrowser,
    db,
    browserRegistry,
    jobRegistry: new BrowserJobRegistry(),
    createJobContext: () => ({}),
  });
});

afterEach(async () => {
  await db.$disconnect();
});

describe("BrowserJobWorker", () => {
  test("processJob", async () => {
    const userId = ulid();
    await db.user.create({
      data: {
        id: userId,
        primaryEmailAddress: "test@email.com",
      },
    });
    const accountId = ulid();
    await db.linkedInAccount.create({
      data: {
        id: accountId,
        userId,
        email: "test@email.com",
        status: "ACTIVE",
        browserProfileId: "123",
        location: "US",
      },
    });

    const jobId = ulid();

    await db.browserJob.create({
      data: {
        id: jobId,
        accountId,
        status: "QUEUED",
        startAt: new Date(),
      },
    });

    await worker.processJob({}, jobId);

    const updatedJob = await db.browserJob.findUnique({
      where: { id: jobId },
    });

    expect(updatedJob).not.toBeNull();
    expect(updatedJob?.status).toBe("COMPLETED");
  });
});
