/// <reference types="vite/client" />

// CSS imports with ?inline suffix return the CSS as a string
declare module "*.css?inline" {
  const content: string;
  export default content;
}

// Support for @sassy/ui CSS imports
declare module "@sassy/ui/styles/theme.css?inline" {
  const content: string;
  export default content;
}
