// No imports needed – browser DOM types are globally available.

/**
 * Determines whether a LinkedIn post is shown because a connection liked/commented/reposted it.
 * The heuristic: presence of a div whose class contains "update-components-header" within the post container.
 * @param postContainer The root element of the post.
 * @returns `true` if it is a friend-activity post, otherwise `false`.
 */
export default function checkFriendsActivity(
  postContainer: HTMLElement,
): boolean {
  const postHeader = postContainer.querySelector(
    "div[class*='update-components-header']",
  );

  if (!postHeader) {
    console.log("THIS IS ORGANIC ACTIVITY");
    return false;
  } else {
    console.log("THIS IS FRIENDS' ACTIVITY");
    return true;
  }
}
