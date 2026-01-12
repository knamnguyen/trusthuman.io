import type { FeedUtilities } from "./types";
import { watchAndRemoveNewPostsPill } from "./utils-shared/watch-and-remove-new-posts-pill";
import { countPosts } from "./utils-v1/count-posts";
import { loadMore } from "./utils-v1/load-more";

export class FeedUtilitiesV1 implements FeedUtilities {
  watchAndRemoveNewPostsPill(): () => void {
    return watchAndRemoveNewPostsPill();
  }

  countPosts(): number {
    return countPosts();
  }

  loadMore(): Promise<boolean> {
    return loadMore();
  }
}
