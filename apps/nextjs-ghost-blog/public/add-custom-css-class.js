// When DOM is ready
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addGhCardClass);
  } else {
    addGhCardClass();
  }

  function addGhCardClass() {
    // Select elements that have BOTH classes:
    // class="kg-embed-card gh-article-image"
    const nodes = document.querySelectorAll(".sb-iframe, .gh-article-image");

    nodes.forEach((el) => {
      // Add gh-card if not already present
      el.classList.add("gh-card");
    });
  }
})();
