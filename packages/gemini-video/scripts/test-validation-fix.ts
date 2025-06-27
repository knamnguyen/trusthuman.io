import { PrismaClient } from "@sassy/db";

import { createGeminiVideoService } from "../src";

const prisma = new PrismaClient();

async function testValidationFix() {
  try {
    console.log("🧪 Testing Validation Fix for Master Script Generation");
    console.log("=====================================================");

    const geminiService = createGeminiVideoService();

    // Get a demo video from the database to test with
    const demoVideo = await prisma.demoVideo.findFirst({
      where: {
        masterScript: {
          not: [], // Make sure it has a master script
        },
      },
    });

    if (!demoVideo) {
      console.log("❌ No demo video with master script found in database");
      return;
    }

    console.log(`📊 Testing with demo video: ${demoVideo.id}`);
    console.log(`📝 S3 URL: ${demoVideo.s3Url}`);
    console.log(
      `📄 Existing product info length: ${demoVideo.productInfo.length} characters`,
    );

    // Test if we can re-generate master script without validation errors
    console.log("\n🚀 Testing master script generation validation...");

    // Upload video to Gemini and generate master script
    const result = await geminiService.condenseDemoVideo({
      videoUrl: demoVideo.s3Url,
      maxDuration: 30,
      numSegments: 5,
    });

    console.log("✅ Validation passed successfully!");
    console.log(
      `📝 Generated product info length: ${result.productInfo.length} characters`,
    );
    console.log(`📊 Generated ${result.segments.length} segments`);
    console.log(`⏱️ Total duration: ${result.totalDuration}s`);

    // Check if product info is within the new limits
    if (result.productInfo.length > 2000) {
      console.log("⚠️  Warning: Product info exceeds 2000 characters");
    } else if (result.productInfo.length > 800) {
      console.log(
        "✅ Product info is within new 2000 character limit (would have failed with old 800 limit)",
      );
    } else {
      console.log(
        "✅ Product info is within both old and new character limits",
      );
    }

    console.log(`\n📝 Product Info Preview (first 200 chars):`);
    console.log(`"${result.productInfo.substring(0, 200)}..."`);
  } catch (error) {
    console.error("❌ Test failed:", error);

    if (error instanceof Error && error.message.includes("800 characters")) {
      console.error(
        "💥 Validation error still shows old 800 character limit - fix may not be applied",
      );
    } else if (
      error instanceof Error &&
      error.message.includes("2000 characters")
    ) {
      console.error(
        "✅ Validation error shows new 2000 character limit - fix is applied but content is still too long",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testValidationFix().catch(console.error);
