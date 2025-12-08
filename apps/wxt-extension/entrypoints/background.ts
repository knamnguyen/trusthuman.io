export default defineBackground(() => {
  console.log("EngageKit WXT Extension - Background script loaded", {
    id: browser.runtime.id,
  });
});

