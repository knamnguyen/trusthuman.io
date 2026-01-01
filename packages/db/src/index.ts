import type { PrismaClient } from "../generated/node";

export * from "../generated/node";
export { Prisma } from "../generated/node";
export { db } from "./client/node";
export { PrismaClientEdge } from "./client/edge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaTransactionalClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
