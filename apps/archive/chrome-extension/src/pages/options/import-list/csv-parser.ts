export type ParsedCsvRow = {
  fullName: string;
  urn?: string;
  linkedinUrl?: string;
  headline?: string;
  profilePic?: string;
};

export type CsvParseError = { row: number; reason: string };

export type CsvParseResult = {
  headerValid: boolean;
  rows: ParsedCsvRow[];
  errors: CsvParseError[];
};

const REQUIRED_HEADERS = [
  "fullName",
  "urn",
  "linkedinUrl",
  "headline",
  "profilePic",
] as const;

/**
 * Robust CSV parser supporting RFC4180-like behavior (quotes, commas, newlines in fields).
 * - Requires exact headers: fullName, urn, linkedinUrl, headline, profilePic
 * - Allows extra columns; they are ignored
 */
export const parseCsv = (text: string): CsvParseResult => {
  const rows: ParsedCsvRow[] = [];
  const errors: CsvParseError[] = [];

  // Normalize newlines
  const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = [] as string[];

  // Merge lines that belong to the same quoted record
  let current = "";
  let inQuotes = false;
  for (const ch of input) {
    if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);

  if (lines.length === 0) {
    return {
      headerValid: false,
      rows: [],
      errors: [{ row: 0, reason: "Empty file" }],
    };
  }

  const first = lines[0] ?? "";
  const header = splitCsvLine(first);
  const headerValid = REQUIRED_HEADERS.every((h, idx) => header[idx] === h);

  if (!headerValid) {
    return {
      headerValid: false,
      rows: [],
      errors: [
        {
          row: 1,
          reason: `Invalid headers. Expected exactly: ${REQUIRED_HEADERS.join(", ")}`,
        },
      ],
    };
  }

  // Map header indices
  const indices: Record<(typeof REQUIRED_HEADERS)[number], number> = {
    fullName: header.indexOf("fullName"),
    urn: header.indexOf("urn"),
    linkedinUrl: header.indexOf("linkedinUrl"),
    headline: header.indexOf("headline"),
    profilePic: header.indexOf("profilePic"),
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const cols = splitCsvLine(line);
    // Skip blank lines
    if (cols.length === 1 && cols[0].trim() === "") continue;

    const value = (idx: number) =>
      idx >= 0 && idx < cols.length ? cols[idx].trim() : "";
    const fullName = value(indices.fullName);
    const urn = (indices.urn >= 0 ? value(indices.urn) : "") || undefined;
    const linkedinUrl =
      (indices.linkedinUrl >= 0 ? value(indices.linkedinUrl) : "") || undefined;
    const headline =
      (indices.headline >= 0 ? value(indices.headline) : "") || undefined;
    const profilePic =
      (indices.profilePic >= 0 ? value(indices.profilePic) : "") || undefined;

    if (!linkedinUrl && !urn) {
      errors.push({ row: i + 1, reason: "Missing both linkedinUrl and urn" });
      continue;
    }

    rows.push({ fullName, urn, linkedinUrl, headline, profilePic });
  }

  return { headerValid: true, rows, errors };
};

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}
