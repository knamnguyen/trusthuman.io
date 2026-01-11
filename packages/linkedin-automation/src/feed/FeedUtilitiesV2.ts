import type { FeedUtilities } from "./types";
import { watchAndRemoveNewPostsPill } from "./utils-v2/watch-and-remove-new-posts-pill";

export class FeedUtilitiesV2 implements FeedUtilities {
  watchAndRemoveNewPostsPill(): () => void {
    return watchAndRemoveNewPostsPill();
  }
}
