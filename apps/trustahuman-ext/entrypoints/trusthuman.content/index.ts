/**
 * TrustHuman website content script
 * Injects a DOM marker so the website can detect extension installation
 */

export default defineContentScript({
  matches: ["https://trusthuman.io/*", "https://*.trusthuman.io/*", "http://localhost:3000/*"],
  runAt: "document_start",

  main() {
    // Inject marker to signal extension is installed
    document.documentElement.setAttribute("data-trusthuman-ext", "installed");
    console.log("TrustHuman: Extension marker injected");
  },
});
