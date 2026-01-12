import type { FeedUtilities } from "./types";
import { watchAndRemoveNewPostsPill } from "./utils-shared/watch-and-remove-new-posts-pill";

export class FeedUtilitiesV1 implements FeedUtilities {
  watchAndRemoveNewPostsPill(): () => void {
    return watchAndRemoveNewPostsPill();
  }
}
