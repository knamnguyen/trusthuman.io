#!/usr/bin/env bun

/**
 * Basic functionality test for Google embeddings
 * Usage: pnpm with-env bun scripts/test-basic-functionality.ts
 */
import { createGoogleEmbeddings } from "../src/embeddings.js";

async function testEmbeddings(): Promise<void> {
  console.log("🧪 Testing Google Embeddings functionality...");

  try {
    // Test environment variable
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in environment");
    }
    console.log("✅ GEMINI_API_KEY found");

    // Create embeddings instance
    const embeddings = createGoogleEmbeddings();
    console.log("✅ Embeddings instance created");

    // Test embedding generation
    const testText = "This is a test video about dancing and music";
    console.log(`🔤 Testing embedding generation for: "${testText}"`);

    const startTime = Date.now();
    const embedding = await embeddings.embedQuery(testText);
    const endTime = Date.now();

    console.log(`✅ Embedding generated in ${endTime - startTime}ms`);
    console.log(`📊 Embedding dimensions: ${embedding.length}`);
    console.log(
      `📈 First 5 values: [${embedding
        .slice(0, 5)
        .map((n) => n.toFixed(4))
        .join(", ")}...]`,
    );

    // Test with multiple documents
    console.log("\n🔤 Testing batch embedding generation...");
    const testDocs = [
      "Funny cat video with adorable kittens playing",
      "Cooking tutorial showing how to make pasta",
      "Travel vlog from beautiful mountain landscapes",
    ];

    const batchStartTime = Date.now();
    const batchEmbeddings = await embeddings.embedDocuments(testDocs);
    const batchEndTime = Date.now();

    console.log(
      `✅ Batch embeddings generated in ${batchEndTime - batchStartTime}ms`,
    );
    console.log(`📊 Generated ${batchEmbeddings.length} embeddings`);

    batchEmbeddings.forEach((emb, index) => {
      console.log(
        `   ${index + 1}. Dimensions: ${emb.length}, First value: ${emb[0].toFixed(4)}`,
      );
    });

    console.log(
      "\n🎉 All tests passed! Google embeddings are working correctly.",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Main execution
async function main(): Promise<void> {
  await testEmbeddings();
}

// Run the script
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
