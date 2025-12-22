import { DBOS } from "@dbos-inc/dbos-sdk";

if (process.env.DBOS_SYSTEM_DATABASE_URL === undefined) {
  throw new Error("DBOS_SYSTEM_DATABASE_URL is not defined");
}

export async function executeWorkflows() {
  DBOS.setConfig({
    name: "engagekit",
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  });

  await DBOS.launch();

  return {
    shutdown: () => DBOS.shutdown(),
  };
}
