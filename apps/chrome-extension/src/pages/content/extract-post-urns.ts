// Function to extract post URNs from data-id attribute
export default function extractPostUrns(postContainer: HTMLElement): string[] {
  // Look for the top-level div with data-id attribute
  const topLevelPost = postContainer.closest("div[data-id]") as HTMLElement;
  if (!topLevelPost) {
    console.log("No div[data-id] found for this post container");
    return [];
  }

  const dataId = topLevelPost.getAttribute("data-id");
  if (!dataId) {
    console.log("No data-id attribute found");
    return [];
  }

  console.log(`Found data-id: ${dataId}`);

  // Extract URNs - handle both single and aggregate format
  // Single: "urn:li:activity:7341086723700936704"
  // Aggregate: "urn:li:aggregate:(urn:li:activity:7341090533815087104,urn:li:activity:7341089862118244355)"
  const urns: string[] = [];

  if (dataId.startsWith("urn:li:aggregate:")) {
    // Handle aggregate format - extract URNs from within parentheses
    const match = dataId.match(/urn:li:aggregate:\((.*)\)/);
    if (match?.[1]) {
      const innerUrns = match[1].split(",").map((urn) => urn.trim());
      urns.push(...innerUrns);
    }
  } else if (dataId.startsWith("urn:li:activity:")) {
    // Handle single activity format
    urns.push(dataId);
  }

  console.log(`Extracted URNs: ${urns.join(", ")}`);
  return urns;
}
