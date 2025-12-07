import path from "node:path";

import { db } from "@sassy/db";

import type { WorkflowExecutorDependencies } from "./workflows";
import { LoggerService } from "./logger";
import { workflowRegistry } from "./workflows";
import { WorkflowExecutor } from "./workflows/workflow";

const loggerService = new LoggerService("trace");
const executor = new WorkflowExecutor<WorkflowExecutorDependencies>(
  loggerService,
  process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "data")
    : ":memory:",
  workflowRegistry,
);

const controller = new AbortController();

void executor.process(controller.signal, {
  db,
});
