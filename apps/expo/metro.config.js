const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// ─── Monorepo Resolution ────────────────────────────────────────────────
// Since Expo SDK 52+, expo/metro-config automatically detects monorepo
// setups (pnpm, yarn workspaces, npm workspaces) and configures
// watchFolders, nodeModulesPaths, and extraNodeModules internally.
//
// DO NOT manually set these — it overrides Expo's auto-detection and
// breaks module resolution for hoisted packages (e.g. lucide-react-native,
// moti). See: https://docs.expo.dev/guides/monorepos/
// ─────────────────────────────────────────────────────────────────────────

// Block server-only packages from being bundled into the React Native app
config.resolver.blockList = [
  /packages\/db\/.*/,
  /packages\/stripe\/.*/,
  /packages\/s3\/.*/,
  /packages\/actors\/.*/,
  /packages\/linkedin-automation\/.*/,
  /packages\/linkedin-scrape-apify\/.*/,
  /packages\/apify-runners\/.*/,
  /packages\/posthog-proxy\/.*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
