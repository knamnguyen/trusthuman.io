import { existsSync } from "node:fs";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Hyperbrowser } from "@hyperbrowser/sdk";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const chromeExtensionBuildZip = path.join(
  __dirname,
  "../../../apps/chrome-extension/dist/engagekit-extension-hyperbrowser.zip",
);

if (existsSync(chromeExtensionBuildZip) === false) {
  console.error(`Build zip not found at path: ${chromeExtensionBuildZip}`);
  process.exit(0);
}

async function run() {
  const hb = new Hyperbrowser({
    apiKey: env.HYPERBROWSER_API_KEY,
  });

  let uploadExtensionResult;
  try {
    uploadExtensionResult = await hb.extensions.create({
      filePath: chromeExtensionBuildZip,
    });
    console.info("Deployed extension:", uploadExtensionResult);
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        "HyperbrowserError deploying extension:",
        err.message,
        err.name,
      );
      process.exit(0);
    }
    console.error("Error deploying extension:", err);
    process.exit(0);
  }

  const persistToDbResult = await db.extensionDeploymentMeta.create({
    data: {
      id: uploadExtensionResult.id,
      createdAt: new Date(),
    },
  });

  console.info("Persisted to DB:", persistToDbResult);
}

void run().catch((err) => {
  console.error("Unhandled error deploying extension:", err);
  process.exit(1);
});
