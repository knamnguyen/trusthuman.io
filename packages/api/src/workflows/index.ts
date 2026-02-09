import { DBOS } from "@dbos-inc/dbos-sdk";

// we must import workflows/scheduled jobs so they get registered to DBOS before DBOS.launch is called
import { buildTargetListWorkflow } from "./build-target-list.workflow";
import { rescanSocialSubmissionWorkflow } from "./rescan-social-submission.workflow";

import "./account.workflows";
import "./email.workflows";

export { buildTargetListWorkflow, rescanSocialSubmissionWorkflow };

export async function initDBOS() {
  if (process.env.DBOS_SYSTEM_DATABASE_URL === undefined) {
    throw new Error("DBOS_SYSTEM_DATABASE_URL is not defined");
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.DBOS_CONDUCTOR_KEY === undefined
  ) {
    throw new Error("DBOS_CONDUCTOR_KEY is not defined in production");
  }

  DBOS.setConfig({
    name: "engagekit",
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  });

  await DBOS.launch({
    conductorKey:
      process.env.NODE_ENV === "production"
        ? process.env.DBOS_CONDUCTOR_KEY
        : undefined,
  });

  return {
    shutdown: () => DBOS.shutdown(),
  };
}
