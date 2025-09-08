import type { ApproveContext, ApproveRowMapping } from "./types";

export function getEditorPlainText(editorField: HTMLElement): string {
  const parts: string[] = [];
  editorField.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "P") {
        const text = el.textContent ?? "";
        parts.push(text);
      } else if (el.tagName === "BR") {
        parts.push("");
      } else {
        parts.push(el.textContent ?? "");
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
    }
  });
  return parts.join("\n").trim();
}

export function setEditorText(editorField: HTMLElement, text: string): void {
  editorField.innerHTML = "";
  const lines = text.split("\n");
  lines.forEach((line) => {
    const p = document.createElement("p");
    if (line === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.textContent = line;
    }
    editorField.appendChild(p);
  });
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });
  editorField.dispatchEvent(inputEvent);
}

export function setRowText(inputEl: HTMLDivElement, text: string): void {
  inputEl.textContent = text;
}

export function addApproveRow(
  context: ApproveContext,
  params: {
    urn: string;
    postContainer: HTMLElement;
    editorField: HTMLElement;
    initialText: string;
  },
): ApproveRowMapping {
  const { urn, postContainer, editorField, initialText } = params;

  const rowEl = document.createElement("div");
  Object.assign(rowEl.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "6px",
    background: "#fafafa",
  } as CSSStyleDeclaration);

  const inputEl = document.createElement("div");
  inputEl.contentEditable = "true";
  inputEl.spellcheck = true;
  Object.assign(inputEl.style, {
    flex: "1",
    minHeight: "32px",
    outline: "none",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    whiteSpace: "pre-wrap",
  } as CSSStyleDeclaration);
  inputEl.textContent = initialText;

  const scrollBtn = document.createElement("button");
  scrollBtn.type = "button";
  scrollBtn.textContent = "Focus";
  Object.assign(scrollBtn.style, {
    padding: "6px 10px",
    background: "#ec4899",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #000",
  } as CSSStyleDeclaration);

  rowEl.appendChild(inputEl);
  rowEl.appendChild(scrollBtn);
  context.list.appendChild(rowEl);

  // Bi-directional sync with guards to prevent loops
  const onRowInput = () => {
    if (context.isUpdatingFromEditor) return;
    context.isUpdatingFromRow = true;
    setEditorText(editorField, inputEl.textContent ?? "");
    context.isUpdatingFromRow = false;
  };

  const onEditorInput = () => {
    if (context.isUpdatingFromRow) return;
    context.isUpdatingFromEditor = true;
    setRowText(inputEl, getEditorPlainText(editorField));
    context.isUpdatingFromEditor = false;
  };

  inputEl.addEventListener("input", onRowInput);
  editorField.addEventListener("input", onEditorInput);

  scrollBtn.addEventListener("click", () => {
    postContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const prevOutline = postContainer.style.outline;
      postContainer.style.outline = "2px solid #ec4899";
      setTimeout(() => {
        postContainer.style.outline = prevOutline;
      }, 1200);
    } catch {}
  });

  const mapping: ApproveRowMapping = {
    urn,
    postContainer,
    editorField,
    rowEl,
    inputEl,
    scrollBtn,
  };

  context.mapByUrn.set(urn, mapping);
  return mapping;
}

export function cleanupApproveContext(context: ApproveContext): void {
  try {
    context.panel.remove();
  } catch {}
  context.mapByUrn.clear();
}
