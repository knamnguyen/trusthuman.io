import { AIDetectorService } from "@sassy/apify-runners/ai-detector-service";

import { fetchLinkedInComment } from "../src/utils/tools/fetch-linkedin-comment";

const TEST_URL =
  "https://www.linkedin.com/feed/update/urn:li:activity:7404071175397601281?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7404071175397601281%2C7404327307546484736%29&dashCommentUrn=urn%3Ali%3Afsd_comment%3A%287404327307546484736%2Curn%3Ali%3Aactivity%3A7404071175397601281%29";

async function testCommentAIWorkflow() {
  console.log("=== LinkedIn Comment AI Detector Test ===\n");

  // Step 1: Fetch comment
  console.log("Step 1: Fetching comment from URL...");
  console.log(`URL: ${TEST_URL}\n`);

  const commentData = await fetchLinkedInComment(TEST_URL);

  if (!commentData) {
    console.error("ERROR: Failed to fetch comment data");
    process.exit(1);
  }

  console.log("Comment fetched successfully!");
  console.log("Author:", commentData.comment.author.name);
  console.log("Text:", commentData.comment.text);
  console.log("Reactions:", commentData.comment.reactions);
  console.log("Relative Time:", commentData.comment.relativeTime);
  console.log();

  // Step 2: Analyze with AI detector
  console.log("Step 2: Analyzing comment text for AI content...\n");

  if (!commentData.comment.text) {
    console.error("ERROR: Comment has no text content");
    process.exit(1);
  }

  const aiDetectorService = new AIDetectorService({
    token: process.env.APIFY_API_TOKEN ?? "",
    actorId: process.env.APIFY_AI_DETECTOR_ACTOR_ID ?? "RoYpcsjrPfLmPCkZJ",
  });

  try {
    const analysis = await aiDetectorService.analyzeText(
      commentData.comment.text,
    );

    console.log("AI Analysis Results:");
    console.log(`- Original: ${analysis.original}%`);
    console.log(`- AI: ${analysis.ai}%`);
    console.log(`- Blocks analyzed: ${analysis.blocks.length}`);
    console.log();

    console.log("=== Test Complete ===");
  } catch (error) {
    console.error("ERROR: AI analysis failed");
    console.error(error);
    process.exit(1);
  }
}

testCommentAIWorkflow();
