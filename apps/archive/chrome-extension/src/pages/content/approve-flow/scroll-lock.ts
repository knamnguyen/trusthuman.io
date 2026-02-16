export function lockScrollAtTop(): () => void {
  const prevHtmlOverflow = document.documentElement.style.overflow;
  const prevBodyOverflow = document.body.style.overflow;

  const prevent = (e: Event) => {
    if (typeof (e as any).preventDefault === "function") {
      (e as any).preventDefault();
    }
    window.scrollTo(0, 0);
  };

  const preventKeys = (e: KeyboardEvent) => {
    const keys = [
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ];
    if (keys.includes(e.key)) {
      e.preventDefault();
    }
  };

  // Move to top and freeze
  window.scrollTo(0, 0);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  window.addEventListener("scroll", prevent, { passive: false });
  window.addEventListener("wheel", prevent, { passive: false });
  window.addEventListener("touchmove", prevent, { passive: false });
  window.addEventListener("keydown", preventKeys, { passive: false });

  return () => {
    window.removeEventListener("scroll", prevent as any);
    window.removeEventListener("wheel", prevent as any);
    window.removeEventListener("touchmove", prevent as any);
    window.removeEventListener("keydown", preventKeys as any);
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
  };
}

