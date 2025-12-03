export type ExtractAsyncIterable<T> =
  T extends AsyncIterable<infer U> ? U : never;
