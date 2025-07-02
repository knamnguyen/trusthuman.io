// Function to parse time strings like "15h", "5m", "2d" into hours
export default function parseTimeStringToHours(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== "string") {
    return null;
  }

  // Remove any extra whitespace and convert to lowercase
  const cleaned = timeStr.trim().toLowerCase();

  // Handle "Promoted" posts
  if (cleaned === "promoted" || cleaned.includes("promoted")) {
    return null;
  }

  // Extract number and unit using regex
  const match = cleaned.match(/^(\d+)([mhdw])$/);
  if (!match) {
    console.log(`Could not parse time string: "${timeStr}"`);
    return null;
  }

  const [, numberStr, unit] = match;
  const number = parseInt(numberStr, 10);

  if (isNaN(number)) {
    return null;
  }

  // Convert to hours
  switch (unit) {
    case "m": // minutes
      return number / 60;
    case "h": // hours
      return number;
    case "d": // days
      return number * 24;
    case "w": // weeks
      return number * 24 * 7;
    default:
      return null;
  }
}
