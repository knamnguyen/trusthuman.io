export function getPaginationMeta<T>(
  items: T[],
  {
    key,
    size,
  }: {
    key: keyof T;
    size: number;
  },
) {
  const hasNextPage = items.length === size;
  const cursor = hasNextPage ? items[items.length - 1]?.[key] : null;
  return {
    hasNextPage,
    cursor,
  };
}
