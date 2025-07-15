// Side-effect module: injects a pink "Engage" button into each LinkedIn comment form.
// When clicked, it generates a single comment for the surrounding post and
// populates the comment editor. Clicking again regenerates/replaces the text.
// important: at this moment, there is no limit client or server side to limit how many comments the user can generate

import extractAuthorInfo from "./extract-author-info";
import extractPostContent from "./extract-post-content";
import generateComment from "./generate-comment";

/*****************************
 * Constant style-guide rules *
 *****************************/
const COMPANY_PRONOUN_RULE =
  "IMPORTANT: You are in company page mode, not individual mode anymore. You're speaking on behalf of a company. ALWAYS use We/we pronouns; NEVER use I/i. This is the rule first and foremost you must follow before looking at any other rules or guide. Again, always use We/we pronouns when referring to yourself instead of I/i";

const LANGUAGE_AWARE_RULE =
  "IMPORTANT: When commenting, detect the language of the original post and comment in the same language. If the post is in English, comment in English; otherwise, switch to that language. Always respect grammar and tone. This rule is mandatory. If the post is in a language other than English, you must try as hard as possible to comment in the same tone and style as the post. If you can't, comment in English.";

/***********************************
 * Core injection/helper functions *
 ***********************************/

// Inject keyframes for spinner once
(() => {
  if (document.getElementById("engage-spin-style")) return;
  const styleTag = document.createElement("style");
  styleTag.id = "engage-spin-style";
  styleTag.textContent = `@keyframes engageSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} .engage-btn--loading{animation:engageSpin 1s linear infinite!important;opacity:.6!important;}`;
  document.head.appendChild(styleTag);
})();

function setLoading(btn: HTMLButtonElement, isLoading: boolean) {
  if (isLoading) {
    btn.classList.add("engage-btn--loading");
  } else {
    btn.classList.remove("engage-btn--loading");
  }
}

/** Insert Engage button into a LinkedIn comment <form>. */
function addEngageButton(form: HTMLFormElement): void {
  // Ensure we have the inner flex container that holds action buttons.
  const buttonContainer = form.querySelector<HTMLElement>(
    ".justify-space-between > .display-flex",
  );
  if (!buttonContainer) return;

  // Avoid duplicate injection.
  if (buttonContainer.querySelector(".engage-btn")) return;

  // Prepare container styles so absolute button positions correctly.
  buttonContainer.style.position = "relative";
  buttonContainer.style.paddingRight = "40px";

  // Create styled circular button.
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "E";
  btn.className = "engage-btn";
  Object.assign(btn.style, {
    background: "#e6007a",
    color: "white",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    cursor: "pointer",
    position: "absolute",
    right: "4px",
    bottom: "4px",
    top: "auto",
    transform: "none",
    zIndex: "2",
  } as CSSStyleDeclaration);

  // Click handler – generate/replace comment text.
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btn.getAttribute("data-busy") === "true") return; // prevent double-clicks

    btn.setAttribute("data-busy", "true");
    setLoading(btn, true);
    try {
      // Locate surrounding post container to obtain context text.

      let postContainer = form.closest("div[data-id]") as HTMLElement | null;
      if (!postContainer) {
        postContainer = form.closest(
          "article[role='article']",
        ) as HTMLElement | null;
      }
      if (!postContainer) {
        postContainer = document.querySelector("main") as HTMLElement | null;
      }

      if (!postContainer) {
        console.warn(
          "Engage button: unable to locate surrounding post container",
        );
        return;
      }

      let postContent = extractPostContent(postContainer);
      // Fallback: If extraction failed, attempt to use innerText of first paragraph within postContainer
      if (!postContent) {
        const fallbackPara = postContainer.querySelector("p");
        postContent = fallbackPara?.textContent?.trim() || "";
      }
      if (!postContent) {
        console.warn("Engage button: unable to extract post content");
        return;
      }

      // Load config from local storage.
      const settings = await new Promise<{
        styleGuide?: string;
        commentAsCompanyEnabled?: boolean;
        commentProfileName?: string; // not used for generation but available
        languageAwareEnabled?: boolean;
      }>((resolve) => {
        chrome.storage.local.get(
          [
            "styleGuide",
            "commentAsCompanyEnabled",
            "commentProfileName",
            "languageAwareEnabled",
          ],
          (r) => resolve(r as any),
        );
      });

      let effectiveStyleGuide = (settings.styleGuide ?? "").trim();

      if (settings.commentAsCompanyEnabled) {
        effectiveStyleGuide = `${COMPANY_PRONOUN_RULE}\n\n${effectiveStyleGuide}\n\n${COMPANY_PRONOUN_RULE}`;
      }
      if (settings.languageAwareEnabled) {
        effectiveStyleGuide = `${LANGUAGE_AWARE_RULE}\n\n${effectiveStyleGuide}`;
      }

      // Prepend author name if available, mirroring bulk-comment logic
      const authorInfo = extractAuthorInfo(postContainer);
      const combinedContent = authorInfo?.name
        ? authorInfo.name + postContent
        : postContent;

      // Generate comment via existing tRPC helper.
      const generated = await generateComment(
        combinedContent,
        effectiveStyleGuide,
      );

      // Find editable field inside form.
      const editableField = form.querySelector<HTMLElement>(
        'div[contenteditable="true"]',
      );
      if (!editableField) {
        console.warn("Engage button: editable field not found");
        return;
      }

      // Replace content with generated comment (preserve paragraphs).
      editableField.innerHTML = "";
      generated.split("\n").forEach((line) => {
        const p = document.createElement("p");
        if (line === "") {
          p.appendChild(document.createElement("br"));
        } else {
          p.textContent = line;
        }
        editableField.appendChild(p);
      });

      // Dispatch input event so LinkedIn recognises changes.
      const inputEvent = new Event("input", {
        bubbles: true,
        cancelable: true,
      });
      editableField.dispatchEvent(inputEvent);
    } catch (err) {
      console.error("Engage button: unexpected error", err);
    } finally {
      btn.removeAttribute("data-busy");
      setLoading(btn, false);
    }
  });

  buttonContainer.appendChild(btn);
}

// Initial scan.
document
  .querySelectorAll<HTMLFormElement>("form.comments-comment-box__form")
  .forEach(addEngageButton);

// Observe for dynamically added forms.
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      const elem = node as HTMLElement;
      if (elem.matches?.("form.comments-comment-box__form")) {
        addEngageButton(elem as HTMLFormElement);
      } else {
        elem
          .querySelectorAll?.("form.comments-comment-box__form")
          .forEach((f) => addEngageButton(f as HTMLFormElement));
      }
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });
