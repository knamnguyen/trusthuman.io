// Function to update comment counts in local storage
export default async function updateCommentCounts(): Promise<void> {
  const today = new Date().toDateString();
  const todayKey = `comments_today_${today}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([todayKey, "totalAllTimeComments"], (result) => {
      const currentTodayCount = result[todayKey] || 0;
      const currentAllTimeCount = result["totalAllTimeComments"] || 0;

      const newTodayCount = currentTodayCount + 1;
      const newAllTimeCount = currentAllTimeCount + 1;

      chrome.storage.local.set(
        {
          [todayKey]: newTodayCount,
          totalAllTimeComments: newAllTimeCount,
        },
        () => {
          console.log(
            `Updated counts - Today: ${newTodayCount}, All-time: ${newAllTimeCount}`,
          );

          // Send real-time update to popup
          chrome.runtime.sendMessage({
            action: "realTimeCountUpdate",
            todayCount: newTodayCount,
            allTimeCount: newAllTimeCount,
          });

          resolve();
        },
      );
    });
  });
}
