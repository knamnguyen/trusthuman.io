export async function retry<TOutput>(
  fn: () => TOutput,
  opts?: {
    timeout?: number;
    interval?: number;
    retryOn?: (output: TOutput) => boolean;
  },
) {
  const { timeout = 10000, interval = 200 } = opts ?? {};
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await Promise.resolve(fn());

      return result;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
      // ignore
    }
  }

  throw new Error("Operation timed out");
}
