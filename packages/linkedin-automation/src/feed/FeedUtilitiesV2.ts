import type { FeedUtilities } from "./types";
import { watchAndRemoveNewPostsPill } from "./utils-shared/watch-and-remove-new-posts-pill";
import { countPosts } from "./utils-v2/count-posts";
import { loadMore } from "./utils-v2/load-more";

export class FeedUtilitiesV2 implements FeedUtilities {
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
