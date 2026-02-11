import { RefObject, useEffect } from "react";

export function useFetchNextPage(
  ref: RefObject<HTMLDivElement | null>,
  ...queries: {
    hasNextPage: boolean;
    fetchNextPage:
      | (({ signal }: { signal: AbortSignal }) => void)
      | (() => void);
  }[]
) {
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const controller = new AbortController();

    const element = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) {
        return;
      }

      for (const query of queries) {
        if (!query.hasNextPage) {
          continue;
        }

        query.fetchNextPage({ signal: controller.signal });
        observer.disconnect();

        break;
      }
    });

    observer.observe(element);
    return () => {
      controller.abort();
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries, ref, ...queries.map((query) => query.hasNextPage)]);
}
