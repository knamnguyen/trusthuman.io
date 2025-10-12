import { existsSync } from "node:fs";
import path from "node:path";
import { Hyperbrowser } from "@hyperbrowser/sdk";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const chromeExtensionBuildZip = path.join(
  __dirname,
  "../../../apps/chrome-extension/dist_build/engagekit-extension.zip",
);

if (existsSync(chromeExtensionBuildZip) === false) {
  console.error(`Build zip not found at path: ${chromeExtensionBuildZip}`);
  process.exit(0);
}

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
