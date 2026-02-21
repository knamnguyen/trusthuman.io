/**
 * Triss Sprite Generator
 *
 * Uses Gemini 2.5 Flash Image API to generate sprite frames for Triss mascot.
 *
 * Usage:
 *   bun run scripts/generate-triss-sprites.ts [sprite-name]
 *
 * Examples:
 *   bun run scripts/generate-triss-sprites.ts          # Generate all sprites
 *   bun run scripts/generate-triss-sprites.ts idle     # Generate only idle sprite
 *   bun run scripts/generate-triss-sprites.ts verified # Generate only verified sprite
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const GEMINI_API_KEY = "AIzaSyAKK1noT_V82rZwMeERRZHUDRj5vxWyJMI";
const GEMINI_MODEL = "gemini-2.5-flash-image";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SCRIPT_DIR = import.meta.dir;
const OUTPUT_DIR = join(SCRIPT_DIR, "../public/sprite-frames");
const REFERENCE_IMAGE_PATH = join(OUTPUT_DIR, "triss-reference.png");
const PROMPTS_PATH = join(SCRIPT_DIR, "triss-prompts.json");

interface PromptConfig {
  baseDescription: string;
  sprites: Record<string, { frames: string[] }>;
}

async function loadReferenceImageBase64(): Promise<string> {
  if (!existsSync(REFERENCE_IMAGE_PATH)) {
    throw new Error(`Reference image not found at ${REFERENCE_IMAGE_PATH}`);
  }
  const buffer = readFileSync(REFERENCE_IMAGE_PATH);
  return buffer.toString("base64");
}

async function generateFrame(
  prompt: string,
  baseDescription: string,
  referenceImageBase64: string
): Promise<Buffer> {
  const fullPrompt = `${baseDescription}

Reference image attached shows the exact character design to use.

Generate a 200x200 pixel image with transparent/white background, no text, no watermarks, centered.

Frame description: ${prompt}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: referenceImageBase64,
            },
          },
          {
            text: fullPrompt,
          },
        ],
      },
    ],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const imageData = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData
  )?.inlineData?.data;

  if (!imageData) {
    console.error("Response:", JSON.stringify(data, null, 2).slice(0, 500));
    throw new Error("No image data in response");
  }

  return Buffer.from(imageData, "base64");
}

async function generateSprite(
  spriteName: string,
  frames: string[],
  baseDescription: string,
  referenceImageBase64: string
): Promise<void> {
  console.log(`\n🎨 Generating ${spriteName} (${frames.length} frames)...`);

  for (let i = 0; i < frames.length; i++) {
    const frameNum = i + 1;
    const outputPath = join(OUTPUT_DIR, `${spriteName}-${frameNum}.png`);

    // Skip if already exists
    if (existsSync(outputPath)) {
      console.log(`  ⏭️  Frame ${frameNum} already exists, skipping`);
      continue;
    }

    console.log(`  🖼️  Generating frame ${frameNum}/${frames.length}...`);

    try {
      const imageBuffer = await generateFrame(
        frames[i],
        baseDescription,
        referenceImageBase64
      );
      writeFileSync(outputPath, imageBuffer);
      console.log(`  ✅ Saved ${outputPath}`);

      // Rate limiting - wait 2 seconds between requests
      if (i < frames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ❌ Failed to generate frame ${frameNum}:`, error);
      throw error;
    }
  }

  console.log(`✅ ${spriteName} complete!`);
}

async function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load prompts config
  const prompts: PromptConfig = JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));

  // Load reference image
  console.log("📷 Loading reference image...");
  const referenceImageBase64 = await loadReferenceImageBase64();
  console.log("✅ Reference image loaded");

  // Get sprite name from args (optional)
  const targetSprite = process.argv[2];

  // Get sprites to generate
  const spriteNames = targetSprite
    ? [targetSprite]
    : Object.keys(prompts.sprites);

  // Validate sprite names
  for (const name of spriteNames) {
    if (!prompts.sprites[name]) {
      console.error(`❌ Unknown sprite: ${name}`);
      console.log(`Available sprites: ${Object.keys(prompts.sprites).join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`\n🚀 Generating ${spriteNames.length} sprite(s): ${spriteNames.join(", ")}`);

  // Generate each sprite
  for (const spriteName of spriteNames) {
    const sprite = prompts.sprites[spriteName];
    await generateSprite(
      `triss-${spriteName}`,
      sprite.frames,
      prompts.baseDescription,
      referenceImageBase64
    );

    // Wait between sprites
    if (spriteNames.indexOf(spriteName) < spriteNames.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next sprite...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("\n🎉 All done!");
  console.log(`\nGenerated frames are in: ${OUTPUT_DIR}`);
  console.log("\nNext steps:");
  console.log("1. Review the generated frames");
  console.log("2. Use an image editor or ImageMagick to stitch them into horizontal sprite sheets");
  console.log("   Example: convert triss-idle-*.png +append triss-idle.png");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
