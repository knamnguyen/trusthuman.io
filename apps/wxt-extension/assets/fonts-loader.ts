// Load fonts dynamically for shadow DOM
export function loadFonts() {
  const fonts = [
    {
      family: "Fira Sans",
      weight: 400,
      file: "fira-sans-latin-400-normal.woff2",
    },
    {
      family: "Fira Sans",
      weight: 700,
      file: "fira-sans-latin-700-normal.woff2",
    },
    {
      family: "JetBrains Mono",
      weight: 400,
      file: "jetbrains-mono-latin-400-normal.woff2",
    },
    {
      family: "JetBrains Mono",
      weight: 700,
      file: "jetbrains-mono-latin-700-normal.woff2",
    },
    {
      family: "Artifika",
      weight: 400,
      file: "artifika-latin-400-normal.woff2",
    },
  ];

  const style = document.createElement("style");
  style.textContent = fonts
    .map((font) => {
      const url = chrome.runtime.getURL(`/fonts/${font.file}`);
      return `
      @font-face {
        font-family: "${font.family}";
        src: url("${url}") format("woff2");
        font-weight: ${font.weight};
        font-style: normal;
        font-display: swap;
      }
    `;
    })
    .join("\n");

  document.documentElement.appendChild(style);
}
