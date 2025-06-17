#!/usr/bin/env bun

/**
 * Test script for video similarity search
 * Usage: pnpm with-env bun scripts/test-similarity-search.ts "text description to search for"
 * Example: pnpm with-env bun scripts/test-similarity-search.ts "funny dance moves"
 */
import type { VideoSearchResult } from "../src/vector-store.js";
import { VideoVectorStore } from "../src/vector-store.js";

interface TestArgs {
  query: string;
  limit: number;
  includeScores: boolean;
  verbose: boolean;
}

class SimilaritySearchTester {
  private vectorStore: VideoVectorStore;

  constructor() {
    this.vectorStore = new VideoVectorStore();
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): TestArgs {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.printUsage();
      process.exit(1);
    }

    const result: TestArgs = {
      query: "",
      limit: 3,
      includeScores: false,
      verbose: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--limit":
        case "-l":
          result.limit = parseInt(args[++i]) || 3;
          break;
        case "--scores":
        case "-s":
          result.includeScores = true;
          break;
        case "--verbose":
        case "-v":
          result.verbose = true;
          break;
        case "--help":
        case "-h":
          this.printUsage();
          process.exit(0);
          break;
        default:
          // Treat as query text
          result.query = arg;
          break;
      }
    }

    if (!result.query) {
      console.error("❌ Error: Query text is required");
      this.printUsage();
      process.exit(1);
    }

    return result;
  }

  /**
   * Print usage instructions
   */
  private printUsage(): void {
    console.log(`
🔍 Video Similarity Search Test Script

Usage:
  pnpm with-env bun scripts/test-similarity-search.ts [options] "query text"

Arguments:
  "query text"    Text description to search for (required)

Options:
  -l, --limit N   Number of results to return (default: 3)
  -s, --scores    Include similarity scores in output
  -v, --verbose   Show detailed video information
  -h, --help      Show this help message

Examples:
  pnpm with-env bun scripts/test-similarity-search.ts "funny dance moves"
  pnpm with-env bun scripts/test-similarity-search.ts --scores --limit 5 "cooking recipes"
  pnpm with-env bun scripts/test-similarity-search.ts --verbose "travel destinations"
`);
  }

  /**
   * Format and display search results
   */
  private displayResults(results: VideoSearchResult[], args: TestArgs): void {
    if (results.length === 0) {
      console.log("📭 No similar videos found for your query.");
      return;
    }

    console.log(
      `\n🎯 Found ${results.length} similar video(s) for: "${args.query}"\n`,
    );

    results.forEach((video, index) => {
      console.log(`📹 ${index + 1}. ${video.title}`);

      if (args.includeScores && video.similarity !== undefined) {
        const similarity = (video.similarity * 100).toFixed(2);
        console.log(`   📊 Similarity: ${similarity}%`);
      }

      if (args.verbose) {
        console.log(`   🆔 ID: ${video.id}`);
        console.log(
          `   📝 Description: ${video.description || "No description"}`,
        );
        console.log(`   🔗 S3 URL: ${video.s3Url}`);
        console.log(`   👀 Views: ${video.views.toLocaleString()}`);
        console.log(`   👍 Likes: ${video.likes.toLocaleString()}`);
        console.log(`   💬 Comments: ${video.comments.toLocaleString()}`);
        console.log(
          `   ⏱️  Duration: ${this.formatDuration(video.durationSeconds)}`,
        );
      } else {
        console.log(`   📝 ${video.description || "No description"}`);
      }

      console.log(); // Empty line for readability
    });
  }

  /**
   * Format duration in seconds to MM:SS format
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  /**
   * Run the similarity search test
   */
  async runTest(): Promise<void> {
    const args = this.parseArgs();

    console.log(`🚀 Starting similarity search test...`);
    console.log(`🔍 Query: "${args.query}"`);
    console.log(`📊 Limit: ${args.limit}`);

    try {
      const startTime = Date.now();

      const results = args.includeScores
        ? await this.vectorStore.findSimilarVideosWithScore(
            args.query,
            args.limit,
          )
        : await this.vectorStore.findSimilarVideos(args.query, args.limit);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Search completed in ${duration}ms`);

      this.displayResults(results, args);
    } catch (error) {
      console.error("❌ Error during similarity search:", error);
      process.exit(1);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const tester = new SimilaritySearchTester();
  await tester.runTest();
}

// Run the script
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
