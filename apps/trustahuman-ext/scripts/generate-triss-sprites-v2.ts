/**
 * Triss Sprite Generator v2
 *
 * Improved version that chains reference images for better consistency.
 * Each frame uses the previous frame as reference (except frame 1 which uses original reference).
 * Last frame loops back to first frame style.
 *
 * Usage:
 *   bun run scripts/generate-triss-sprites-v2.ts [sprite-name]
 *
 * Examples:
 *   bun run scripts/generate-triss-sprites-v2.ts          # Generate all sprites
 *   bun run scripts/generate-triss-sprites-v2.ts idle     # Generate only idle sprite
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const GEMINI_API_KEY = "AIzaSyAKK1noT_V82rZwMeERRZHUDRj5vxWyJMI";
const GEMINI_MODEL = "gemini-2.5-flash-image";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SCRIPT_DIR = import.meta.dir;
const OUTPUT_DIR = join(SCRIPT_DIR, "../public/sprite-frames");
const REFERENCE_IMAGE_PATH = join(OUTPUT_DIR, "triss-reference.png");
const PROMPTS_PATH = join(SCRIPT_DIR, "triss-prompts-v3.json");

interface SpriteConfig {
  description: string;
  chainFromPrevious: boolean;
  frames: string[];
}

interface PromptConfig {
  baseDescription: string;
  globalRules: string;
  sprites: Record<string, SpriteConfig>;
}

async function loadImageBase64(path: string): Promise<string> {
  if (!existsSync(path)) {
    throw new Error(`Image not found at ${path}`);
  }
  const buffer = readFileSync(path);
  return buffer.toString("base64");
}

async function generateFrame(
  prompt: string,
  baseDescription: string,
  globalRules: string,
  spriteDescription: string,
  referenceImageBase64: string,
  previousFrameBase64?: string,
  isLastFrame?: boolean,
  firstFrameBase64?: string
): Promise<Buffer> {
  // Build the full prompt
  let fullPrompt = `${baseDescription}

${globalRules}

Animation: ${spriteDescription}

`;

  if (isLastFrame && firstFrameBase64) {
    fullPrompt += `IMPORTANT: This is the LAST frame of the animation loop. It should smoothly transition back to the FIRST frame. The pose and expression should be ready to loop back to the beginning.

`;
  }

  if (previousFrameBase64) {
    fullPrompt += `The SECOND attached image shows the PREVIOUS frame of this animation. Generate the NEXT frame that follows naturally from it. Keep Triss looking EXACTLY the same (same body shape, same style, same proportions). Only change what the prompt describes.

`;
  }

  fullPrompt += `Frame to generate: ${prompt}`;

  // Build request parts
  const parts: any[] = [
    {
      inlineData: {
        mimeType: "image/png",
        data: referenceImageBase64,
      },
    },
  ];

  // Add previous frame as second reference if available
  if (previousFrameBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: previousFrameBase64,
      },
    });
  }

  // Add first frame as reference for last frame (for loop continuity)
  if (isLastFrame && firstFrameBase64 && firstFrameBase64 !== previousFrameBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: firstFrameBase64,
      },
    });
  }

  parts.push({ text: fullPrompt });

  const requestBody = {
    contents: [{ parts }],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    console.error("Response:", JSON.stringify(data, null, 2).slice(0, 1000));
    throw new Error("No image data in response");
  }

  return Buffer.from(imageData, "base64");
}

async function generateSprite(
  spriteName: string,
  config: SpriteConfig,
  baseDescription: string,
  globalRules: string,
  referenceImageBase64: string,
  forceRegenerate: boolean = false
): Promise<void> {
  const frames = config.frames;
  console.log(`\n🎨 Generating ${spriteName} (${frames.length} frames)...`);
  console.log(`   ${config.description}`);

  let previousFrameBase64: string | undefined;
  let firstFrameBase64: string | undefined;

  for (let i = 0; i < frames.length; i++) {
    const frameNum = i + 1;
    const outputPath = join(OUTPUT_DIR, `${spriteName}-${frameNum}.png`);
    const isLastFrame = i === frames.length - 1;

    // Skip if already exists (unless force regenerate)
    if (existsSync(outputPath) && !forceRegenerate) {
      console.log(`  ⏭️  Frame ${frameNum} already exists, skipping`);
      // Load it as previous frame reference for next iteration
      if (config.chainFromPrevious) {
        previousFrameBase64 = await loadImageBase64(outputPath);
        if (i === 0) {
          firstFrameBase64 = previousFrameBase64;
        }
      }
      continue;
    }

    console.log(`  🖼️  Generating frame ${frameNum}/${frames.length}...`);

    try {
      const imageBuffer = await generateFrame(
        frames[i],
        baseDescription,
        globalRules,
        config.description,
        referenceImageBase64,
        config.chainFromPrevious ? previousFrameBase64 : undefined,
        isLastFrame,
        firstFrameBase64
      );

      writeFileSync(outputPath, imageBuffer);
      console.log(`  ✅ Saved ${outputPath}`);

      // Update previous frame reference for chaining
      if (config.chainFromPrevious) {
        previousFrameBase64 = imageBuffer.toString("base64");
        if (i === 0) {
          firstFrameBase64 = previousFrameBase64;
        }
      }

      // Rate limiting - wait between requests
      if (i < frames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    } catch (error) {
      console.error(`  ❌ Failed to generate frame ${frameNum}:`, error);
      throw error;
    }
  }

  console.log(`✅ ${spriteName} complete!`);
}

async function main() {
  // Check for --force flag
  const forceRegenerate = process.argv.includes("--force");
  if (forceRegenerate) {
    console.log("⚠️  Force regenerate mode: will overwrite existing frames");
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load prompts config
  const prompts: PromptConfig = JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));

  // Load reference image
  console.log("📷 Loading reference image...");
  const referenceImageBase64 = await loadImageBase64(REFERENCE_IMAGE_PATH);
  console.log("✅ Reference image loaded");

  // Get sprite name from args (optional, excluding --force)
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const targetSprite = args[0];

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
      sprite,
      prompts.baseDescription,
      prompts.globalRules,
      referenceImageBase64,
      forceRegenerate
    );

    // Wait between sprites
    if (spriteNames.indexOf(spriteName) < spriteNames.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next sprite...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("\n🎉 All done!");
  console.log(`\nGenerated frames are in: ${OUTPUT_DIR}`);
  console.log("\nTo stitch into sprite sheets:");
  console.log("  convert triss-idle-*.png +append ../sprites/triss-idle.png");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
