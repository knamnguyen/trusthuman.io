// Function to extract post URNs from either data-urn (preferred) or data-id (fallback)
export default function extractPostUrns(postContainer: HTMLElement): string[] {
  // Prefer data-urn
  let topLevelPost = postContainer.closest(
    "div[data-urn]",
  ) as HTMLElement | null;
  let attrName: "data-urn" | "data-id" | null = null;

  if (topLevelPost) {
    attrName = "data-urn";
  } else {
    // Fallback to data-id
    topLevelPost = postContainer.closest("div[data-id]") as HTMLElement | null;
    if (topLevelPost) {
      attrName = "data-id";
    }
  }

  if (!topLevelPost || !attrName) {
    console.log("No suitable post container found (data-urn or data-id)");
    return [];
  }

  const raw = topLevelPost.getAttribute(attrName);
  if (!raw) {
    console.log(`No ${attrName} attribute found`);
    return [];
  }

  console.log(`Found ${attrName}: ${raw}`);

  // Extract URNs - handle both single and aggregate format
  // Single: "urn:li:activity:7341086723700936704"
  // Aggregate: "urn:li:aggregate:(urn:li:activity:...,urn:li:activity:...)"
  const urns: string[] = [];

  if (raw.startsWith("urn:li:aggregate:")) {
    const match = raw.match(/urn:li:aggregate:\((.*)\)/);
    if (match?.[1]) {
      const innerUrns = match[1].split(",").map((urn) => urn.trim());
      urns.push(...innerUrns);
    }
  } else if (raw.startsWith("urn:li:activity:")) {
    urns.push(raw);
  }

  console.log(`Extracted URNs: ${urns.join(", ")}`);
  return urns;
}
