export function paginate<T, K extends keyof T>(
  items: T[],
  {
    key,
    size,
  }: {
    key: K;
    size: number;
  },
) {
  const hasNextPage = items.length > size;
  const paginatedItems = items.slice(0, size);
  const cursor = hasNextPage ? (paginatedItems.at(-1)?.[key] ?? null) : null;
  return {
    data: paginatedItems,
    next: cursor,
  };
}
