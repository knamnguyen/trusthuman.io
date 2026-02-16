/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-mobile-react-native/src/**/*.{ts,tsx}",
  ],
  presets: [
    require("nativewind/preset"),
    require("@sassy/ui-mobile-react-native/tailwind-preset"),
  ],
};
