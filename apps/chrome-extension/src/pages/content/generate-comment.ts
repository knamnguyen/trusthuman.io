// Function to generate comment using background script
export default async function generateComment(
  postContent: string,
): Promise<string> {
  return new Promise((resolve) => {
    console.log(
      "🤖 Requesting comment generation for post content:",
      postContent.substring(0, 200) + "...",
    );

    // Set up a 30-second timeout
    const timeout = setTimeout(() => {
      console.error(
        "⏰ FALLBACK REASON: Comment generation timed out after 30 seconds",
      );
      console.error(
        "⏰ TIMEOUT - No response from background script within 30 seconds",
      );
      resolve("Great post! Thanks for sharing.");
    }, 30000);

    // Retry mechanism for connection issues
    const attemptGeneration = (attempt: number = 1): void => {
      console.log(
        `🔄 Attempt ${attempt}/3: Sending comment generation request...`,
      );

      chrome.runtime.sendMessage(
        {
          action: "generateComment",
          postContent: postContent,
        },
        (response) => {
          clearTimeout(timeout); // Clear the timeout since we got a response

          if (chrome.runtime.lastError) {
            console.error(
              `💥 ATTEMPT ${attempt} FAILED - Chrome runtime error:`,
              chrome.runtime.lastError,
            );

            // Check if it's a connection error and retry
            if (
              chrome.runtime.lastError.message?.includes(
                "Could not establish connection",
              ) &&
              attempt < 3
            ) {
              console.log(
                `🔄 Connection error detected, retrying in 2 seconds... (attempt ${
                  attempt + 1
                }/3)`,
              );
              setTimeout(() => {
                attemptGeneration(attempt + 1);
              }, 2000);
              return;
            }

            console.error(
              "💥 FALLBACK REASON: Chrome runtime error during comment generation",
            );
            console.error("💥 CHROME ERROR:", chrome.runtime.lastError);
            console.error(
              "💥 This usually means the background script crashed or message passing failed",
            );
            resolve("Great post! Thanks for sharing.");
          } else if (!response) {
            console.error(
              `❌ ATTEMPT ${attempt} FAILED - No response received from background script`,
            );

            // Retry if no response
            if (attempt < 3) {
              console.log(
                `🔄 No response received, retrying in 2 seconds... (attempt ${
                  attempt + 1
                }/3)`,
              );
              setTimeout(() => {
                attemptGeneration(attempt + 1);
              }, 2000);
              return;
            }

            console.error(
              "❌ FALLBACK REASON: No response received from background script after 3 attempts",
            );
            console.error(
              "❌ RESPONSE NULL - Background script may have failed silently",
            );
            resolve("Great post! Thanks for sharing.");
          } else if (!response.comment) {
            console.error(
              "⚠️ FALLBACK REASON: Response received but no comment field",
            );
            console.error("⚠️ INVALID RESPONSE STRUCTURE:", response);
            console.error(
              "⚠️ Expected response.comment but got:",
              Object.keys(response),
            );
            resolve("Great post! Thanks for sharing.");
          } else if (response.comment === "Great post! Thanks for sharing.") {
            console.error(
              "🚨 FALLBACK REASON: Background script returned the default fallback comment",
            );
            console.error(
              "🚨 This means the AI API failed and background script used fallback",
            );

            // Check if error details were provided in the response
            if (response.error) {
              console.group("🔥 AI API ERROR DETAILS FROM RESPONSE");
              console.error("🔥 Error Message:", response.error.message);
              console.error("🔥 Error Type:", response.error.name);
              console.error("🔥 API Key Status:", response.error.apiKey);
              console.error(
                "🔥 Style Guide Status:",
                response.error.styleGuide,
              );
              console.error(
                "🔥 Post Content Length:",
                response.error.postContentLength,
                "characters",
              );
              if (response.error.stack) {
                console.error("🔥 Stack Trace:", response.error.stack);
              }
              console.groupEnd();
            } else {
              console.error(
                "🚨 No error details provided - check background script console",
              );
            }

            resolve(response.comment);
          } else {
            console.log(
              "✅ Successfully received generated comment:",
              response.comment.substring(0, 100) + "...",
            );
            resolve(response.comment);
          }
        },
      );
    };

    // Start the first attempt
    attemptGeneration(1);
  });
}
