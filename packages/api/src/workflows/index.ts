import { DBOS } from "@dbos-inc/dbos-sdk";

// we must import workflows so they get registered to DBOS before DBOS.launch is called
import { buildTargetListWorkflow } from "./build-target-list.workflow";
import { rescanSocialSubmissionWorkflow } from "./rescan-social-submission.workflow";

export { buildTargetListWorkflow, rescanSocialSubmissionWorkflow };

export async function initDBOS() {
  if (process.env.DBOS_SYSTEM_DATABASE_URL === undefined) {
    throw new Error("DBOS_SYSTEM_DATABASE_URL is not defined");
  }

  DBOS.setConfig({
    name: "engagekit",
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  });

  await DBOS.launch();

  return {
    shutdown: () => DBOS.shutdown(),
  };
}
