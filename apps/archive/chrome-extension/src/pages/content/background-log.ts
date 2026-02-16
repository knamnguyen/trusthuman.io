// Background logging functions to send logs to background script
const backgroundLog = (...args: any[]) => {
  console.log(...args); // Still log to content script console
  chrome.runtime
    .sendMessage({
      action: "backgroundLog",
      level: "log",
      args: args,
    })
    .catch(() => {
      /* ignore if background script not available */
    });
};

const backgroundError = (...args: any[]) => {
  console.error(...args); // Still log to content script console
  chrome.runtime
    .sendMessage({
      action: "backgroundLog",
      level: "error",
      args: args,
    })
    .catch(() => {
      /* ignore if background script not available */
    });
};

const backgroundWarn = (...args: any[]) => {
  console.warn(...args); // Still log to content script console
  chrome.runtime
    .sendMessage({
      action: "backgroundLog",
      level: "warn",
      args: args,
    })
    .catch(() => {
      /* ignore if background script not available */
    });
};

const backgroundGroup = (...args: any[]) => {
  console.group(...args); // Still log to content script console
  chrome.runtime
    .sendMessage({
      action: "backgroundLog",
      level: "group",
      args: args,
    })
    .catch(() => {
      /* ignore if background script not available */
    });
};

const backgroundGroupEnd = () => {
  console.groupEnd(); // Still log to content script console
  chrome.runtime
    .sendMessage({
      action: "backgroundLog",
      level: "groupEnd",
      args: [],
    })
    .catch(() => {
      /* ignore if background script not available */
    });
};

export {
  backgroundLog,
  backgroundError,
  backgroundWarn,
  backgroundGroup,
  backgroundGroupEnd,
};
