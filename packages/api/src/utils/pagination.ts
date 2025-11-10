export function getPaginationMeta<T, K extends keyof T>(
  items: T[],
  {
    key,
    size,
  }: {
    key: K;
    size: number;
  },
) {
  const hasNextPage = items.length === size;
  const cursor = hasNextPage ? (items[items.length - 1]?.[key] as T[K]) : null;
  return {
    hasNextPage,
    cursor,
  };
}
