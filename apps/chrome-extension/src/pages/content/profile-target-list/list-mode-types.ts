export interface ListModeState {
  authorsFound: string[];
  authorsMissing: string[];
  authorsPending: string[];
  authorsCommented: string[];
}

export interface SelectedListAuthors {
  originalNames: string[];
  normalizedNames: string[];
}

export const LIST_MODE_DEFAULT_TIMEOUT_MS = 60_000;

export const normalizeAuthorName = (name: string): string =>
  name.replace(/\s+/g, " ").trim().toLowerCase();
