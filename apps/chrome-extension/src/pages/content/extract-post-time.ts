import parseTimeStringToHours from "@src/utils/parse-time-string-to-hours";

// Function to extract post time from post container
export default function extractPostTime(
  postContainer: HTMLElement,
): number | null {
  try {
    // Look for the time span with the specific classes
    const timeSpan = postContainer.querySelector(
      ".update-components-actor__sub-description.text-body-xsmall",
    );

    if (!timeSpan || !timeSpan.textContent) {
      console.log("Time span not found or has no text content");
      return null;
    }

    const timeText = timeSpan.textContent.trim();
    console.log(`Found time text: "${timeText}"`);

    return parseTimeStringToHours(timeText);
  } catch (error) {
    console.error("Error extracting post time:", error);
    return null;
  }
}
