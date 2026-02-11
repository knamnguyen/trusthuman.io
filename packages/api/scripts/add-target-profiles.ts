import { S3Client } from "bun";
import PQueue from "p-queue";
import Papa from "papaparse";
import { ulid } from "ulidx";
import { z } from "zod";

import { db } from "@sassy/db";

const schema = z.object({
  profile_url: z.string().min(1).url(),
  public_id: z.string().optional(),
  hash_id: z.string(),
  full_name: z.string().optional(),
  profileSlug: z.string().optional(),
  headline: z.string().optional(),
  avatar: z
    .string()
    .url()
    .optional()
    .catch(() => undefined),
});

if (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID === undefined) {
  throw new Error("CLOUDFLARE_R2_ACCESS_KEY_ID is not defined");
}

if (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY === undefined) {
  throw new Error("CLOUDFLARE_R2_SECRET_ACCESS_KEY is not defined");
}

const s3 = new S3Client({
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  endpoint: "https://4bc7f91bb751d3c7484fcc5891d3dbd4.r2.cloudflarestorage.com",
  bucket: "engagekit",
});

const queue = new PQueue({ interval: 1000, intervalCap: 100 });

async function run() {
  const accountId = "01KG5CBVYH866ZRHY5ZDDJF8AX"; // Replace with the actual account ID
  const csv = [
    "/Users/zihaolam/Downloads/kelly1.csv",
    "/Users/zihaolam/Downloads/kelly2.csv",
  ];

  for (const filePath of csv) {
    const toAdd = [];

    const file = Bun.file(filePath);
    const parsed = Papa.parse(await file.text(), {
      header: true,
    });

    for (const row of parsed.data) {
      if (filePath === "/Users/zihaolam/Downloads/kelly2.csv") {
        console.info(row);
      }
      const parsed = schema.safeParse(row);

      if (parsed.success === false) {
        console.error("Invalid row:", row);
        continue;
      }

      const data = parsed.data;

      toAdd.push({
        id: ulid(),
        accountId,
        linkedinUrl: data.profile_url,
        profileUrn: data.hash_id,
        name: data.full_name,
        profileSlug: data.public_id,
        headline: data.headline,
        photoUrl: data.avatar,
      });

      const avatar = data.avatar;

      if (avatar !== undefined) {
        void queue.add(async () => {
          const response = await fetch(avatar);
          await s3.write(`/avatars/${data.hash_id}`, response);
          console.log(`Uploaded avatar for ${data.hash_id}`);
        });
      }
    }

    const result = await db.targetProfile.createMany({
      data: toAdd,
      skipDuplicates: true,
    });

    console.log(`Processed file: ${filePath}, Added: ${result.count} profiles`);
  }
}

if (import.meta.main) {
  await run();
}
