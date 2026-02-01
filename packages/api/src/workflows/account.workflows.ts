import { DBOS, SchedulerMode } from "@dbos-inc/dbos-sdk";

import { db } from "@sassy/db";

async function resetDailyQuotas(_scheduledTime: Date, _startTime: Date) {
  const result = await DBOS.runStep(
    async () => {
      return db.linkedInAccount.updateMany({
        data: { dailyAIcomments: 0 },
      });
    },
    { name: "reset-daily-quotas-step" },
  );

  DBOS.logger.info(
    `[reset-daily-quotas] Reset completed. Accounts updated: ${result.count}`,
  );
}

DBOS.registerScheduled(resetDailyQuotas, {
  crontab: "0 0 * * *",
  mode: SchedulerMode.ExactlyOncePerInterval,
  name: "resetDailyQuotas",
});
