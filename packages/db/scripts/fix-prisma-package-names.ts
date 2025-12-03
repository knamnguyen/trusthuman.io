#!/usr/bin/env tsx
/**
 * Post-generation script to fix Prisma generated package.json names
 *
 * Prisma generates package.json files with hash-based names that are identical
 * for both node and edge clients. This script updates them to match the expected
 * package names so TypeScript/IDE can resolve imports correctly.
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generatedDir = join(__dirname, "..", "generated");

// Fix edge package.json
const edgePackageJsonPath = join(generatedDir, "edge", "package.json");
const edgePackageJson = JSON.parse(readFileSync(edgePackageJsonPath, "utf-8"));
edgePackageJson.name = "@sassy/db-edge";
writeFileSync(
  edgePackageJsonPath,
  JSON.stringify(edgePackageJson, null, 2) + "\n",
);

// Fix node package.json
const nodePackageJsonPath = join(generatedDir, "node", "package.json");
const nodePackageJson = JSON.parse(readFileSync(nodePackageJsonPath, "utf-8"));
nodePackageJson.name = "@sassy/db-node";
writeFileSync(
  nodePackageJsonPath,
  JSON.stringify(nodePackageJson, null, 2) + "\n",
);

console.log("✅ Fixed Prisma generated package names:");
console.log("   - generated/edge/package.json → @sassy/db-edge");
console.log("   - generated/node/package.json → @sassy/db-node");
