import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { PGlite } from "@electric-sql/pglite";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
import { vector } from "@electric-sql/pglite/vector";
import { PrismaPGlite } from "pglite-prisma-adapter";

import type { PrismaClientType } from "./node";
import { PrismaClient as EdgePrismaClient } from "../../generated/edge";

async function migrate(
  pg: PGlite,
  migrationFilepath = resolve(__dirname, "../../schema.sql"),
) {
  if (existsSync(migrationFilepath) === false) {
    throw new Error(`Migration file not found at path: ${migrationFilepath}`);
  }

  const buffer = await readFile(migrationFilepath);
  const sql = buffer.toString();
  await pg.exec(sql);
}

export const createTestPrismaClient = async () => {
  // Initialize PGlite client with the database directory
  const pg = new PGlite({
    extensions: { uuid_ossp, vector },
  });

  // Initialize the PGlite adapter for Prisma
  const adapter = new PrismaPGlite(pg);

  // Create Prisma client with the adapter
  const prisma = new EdgePrismaClient({ adapter });

  await migrate(pg);

  return prisma as PrismaClientType;
};
