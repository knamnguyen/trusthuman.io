// @ts-nocheck

(() => {
  // 1. Get your display name quickly, using direct DOM access
  let yourName;
  {
    const spans = document.getElementsByClassName(
      "comments-comment-meta__description-title",
    );
    for (let i = 0; i < spans.length; ++i) {
      const span = spans[i];
      if (span.textContent && span.parentElement.innerText.includes("You")) {
        yourName = span.textContent.trim();
        break;
      }
    }
  }

  // 2. Parse impression count ("1,234" → 1234)
  function parseImpressions(text) {
    if (!text) return 0;
    const match = text.replace(/,/g, "").match(/([\d]+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // 3. Get all post <li>s in the main feed, using only fast DOM methods
  function getListItems() {
    const infiniteScrollContainer = document.getElementsByClassName(
      "scaffold-finite-scroll__content",
    )[0];
    if (!infiniteScrollContainer) return [];
    const postList = infiniteScrollContainer.getElementsByTagName("ul")[0];
    if (!postList) return [];
    // Avoid querySelectorAll: get all <li> elements directly
    return postList.getElementsByTagName("li");
  }

  // 4. Get the URN of a post, using getElementsByClassName and .dataset
  function getPostUrn(li) {
    // getElementsByClassName returns a collection; take the first match
    const posts = li.getElementsByClassName("feed-shared-update-v2");
    if (posts.length === 0) return null;
    return posts[0].dataset.urn || null;
  }

  // 5. Main update logic: sort and manipulate posts, but no duplicate or filtering logic
  function updateAll() {
    const listItems = getListItems();
    let posts = [];
    let totalImpressions = 0;

    for (let i = 0; i < listItems.length; ++i) {
      const li = listItems[i];

      // Find your top-level comment article (fast loop, minimal DOM traversal)
      let yourCommentArticle = null;
      const articles = li.getElementsByTagName("article");
      for (let j = 0; j < articles.length; ++j) {
        const article = articles[j];
        if (!article.classList.contains("comments-comment-entity")) continue;
        const author = article.getElementsByClassName(
          "comments-comment-meta__description-title",
        )[0];
        if (!author) continue;
        if (
          author.textContent.trim() === yourName &&
          article.innerText.includes("You")
        ) {
          yourCommentArticle = article;
          break;
        }
      }
      // If not found, skip this <li> (don't remove it, just don't operate on it)
      if (!yourCommentArticle) continue;

      // Find impressions and replies
      const impressionEl = yourCommentArticle.getElementsByClassName(
        "comments-comment-social-bar__impressions-count",
      )[0];
      const impressions = impressionEl
        ? parseImpressions(impressionEl.textContent)
        : 0;
      totalImpressions += impressions;

      const repliesCountEl = yourCommentArticle.getElementsByClassName(
        "comments-comment-social-bar__replies-count--cr",
      )[0];
      const hasReplies = !!(
        repliesCountEl && parseImpressions(repliesCountEl.textContent) > 0
      );

      const postContainer = li.getElementsByClassName(
        "fie-impression-container",
      )[0];
      const urn = getPostUrn(li);

      posts.push({
        li,
        urn,
        yourCommentArticle,
        impressionEl,
        impressions,
        hasReplies,
        postContainer,
      });
    }

    // Sort: replies first, then by impressions descending
    posts.sort((a, b) => {
      if (a.hasReplies !== b.hasReplies) return b.hasReplies - a.hasReplies;
      return b.impressions - a.impressions;
    });

    // Re-order <li>s in DOM
    if (posts.length) {
      const ul = posts[0].li.parentElement;
      for (let i = 0; i < posts.length; ++i) {
        ul.appendChild(posts[i].li);
      }
    }

    // Manipulate each post: header/load more/toggle
    for (let i = 0; i < posts.length; ++i) {
      const { li, yourCommentArticle, postContainer } = posts[i];

      // Remove header and "load more" containers (if present)
      const headers = li.getElementsByClassName("update-components-header");
      while (headers.length) headers[0].remove();
      const loadMore = li.getElementsByClassName(
        "comments-comment-list__load-more-container",
      );
      while (loadMore.length) loadMore[0].remove();
      const oldToggles = li.getElementsByClassName("custom-li-toggle-btn");
      while (oldToggles.length) oldToggles[0].remove();

      // Only auto-collapse if never toggled before
      if (postContainer && postContainer.dataset.postCollapsed === undefined) {
        postContainer.style.display = "none";
        postContainer.dataset.postCollapsed = "true";
      }

      // Toggle button (per post)
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "custom-li-toggle-btn";
      toggleBtn.style.display = "flex";
      toggleBtn.style.alignItems = "center";
      toggleBtn.style.cursor = "pointer";
      toggleBtn.style.background = "none";
      toggleBtn.style.border = "none";
      toggleBtn.style.color = "#0073b1";
      toggleBtn.style.padding = "4px 0";
      toggleBtn.tabIndex = 0;

      let isCollapsed = postContainer && postContainer.style.display === "none";
      toggleBtn.innerHTML = `<span style="display:inline-block;transform:${isCollapsed ? "rotate(-90deg)" : "rotate(0deg)"};transition:transform .2s;" aria-label="Expand post">&#9654;</span><span style="margin-left:8px;">${isCollapsed ? "Show Post" : "Hide Post"}</span>`;

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const arrow = toggleBtn.querySelector("span");
        if (postContainer.style.display === "none") {
          postContainer.style.display = "";
          postContainer.dataset.postCollapsed = "false";
          arrow.style.transform = "rotate(0deg)";
          toggleBtn.querySelector("span + span").textContent = "Hide Post";
        } else {
          postContainer.style.display = "none";
          postContainer.dataset.postCollapsed = "true";
          arrow.style.transform = "rotate(-90deg)";
          toggleBtn.querySelector("span + span").textContent = "Show Post";
        }
      });

      // Insert the toggle button after the comment
      if (yourCommentArticle && yourCommentArticle.parentNode) {
        if (yourCommentArticle.nextSibling) {
          yourCommentArticle.parentNode.insertBefore(
            toggleBtn,
            yourCommentArticle.nextSibling,
          );
          if (postContainer && toggleBtn.nextSibling !== postContainer) {
            yourCommentArticle.parentNode.insertBefore(
              postContainer,
              toggleBtn.nextSibling,
            );
          }
        } else {
          yourCommentArticle.parentNode.appendChild(toggleBtn);
          if (postContainer)
            yourCommentArticle.parentNode.appendChild(postContainer);
        }
      }
    }

    // Log total impressions (only if changed)
    if (window.__LINKEDIN_TOTAL_IMPRESSIONS__ !== totalImpressions) {
      window.__LINKEDIN_TOTAL_IMPRESSIONS__ = totalImpressions;
      console.log(
        `[LinkedIn Posts Script] Total impressions across all your comments:`,
        totalImpressions,
      );
    }
  }

  // Initial + delayed run (for late content)
  updateAll();
  setTimeout(updateAll, 1200);

  // MutationObserver: only fires when a <li> is added/removed (not on every subtree change)
  function observeUl() {
    const scrollContent = document.getElementsByClassName(
      "scaffold-finite-scroll__content",
    )[0];
    if (!scrollContent) return;
    const ul = scrollContent.getElementsByTagName("ul")[0];
    if (!ul) return;

    let debounceTimer = null;
    function debouncedUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateAll, 200);
    }

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; ++i) {
        const mutation = mutations[i];
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          debouncedUpdate();
          break;
        }
      }
    });
    observer.observe(ul, { childList: true, subtree: false });
    window.__linkedin_posts_observer__ = observer;
  }
  observeUl();
})();
