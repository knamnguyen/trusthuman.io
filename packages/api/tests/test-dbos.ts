/**
 * Quick test script to verify DBOS connection
 * Run with: bun run packages/api/test-dbos.ts
 */

import { config } from "dotenv";

import { initDBOS } from "../src/workflows/index";

// Load environment variables
config({ path: ".env" });

async function testDBOSConnection() {
  console.log("🧪 Testing DBOS Connection...\n");

  console.log(
    "DBOS_SYSTEM_DATABASE_URL:",
    process.env.DBOS_SYSTEM_DATABASE_URL,
  );

  try {
    console.log("\n1️⃣ Initializing DBOS...");
    const dbos = await initDBOS();
    console.log("✅ DBOS initialized successfully!");

    console.log("\n2️⃣ Testing system database connection...");
    console.log("✅ System database connected!");

    console.log("\n3️⃣ Cleaning up...");
    await dbos.shutdown();
    console.log("✅ DBOS shutdown successfully!");

    console.log("\n🎉 All DBOS tests passed! Your setup is working correctly.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ DBOS test failed:");
    console.error(error);
    process.exit(1);
  }
}

void testDBOSConnection();
