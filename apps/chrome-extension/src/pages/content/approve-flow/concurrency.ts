export const MAX_CONCURRENCY = 10;

export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  for (let start = 0; start < items.length; start += batchSize) {
    const end = Math.min(start + batchSize, items.length);
    const slice = items.slice(start, end);
    const settled = await Promise.allSettled(
      slice.map((item, i) => worker(item, start + i)),
    );
    for (let i = 0; i < settled.length; i++) {
      const idx = start + i;
      const s = settled[i]!;
      if (s.status === "fulfilled") {
        results[idx] = s.value as R;
      } else {
        results[idx] = undefined as unknown as R;
      }
    }
  }
  return results;
}
