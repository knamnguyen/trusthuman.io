import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@sassy/ui/button";

type PageState = "loading" | "linkedin" | "other";

export default function App() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // Check if current tab is LinkedIn
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab?.url?.includes("linkedin.com")) {
        setPageState("linkedin");
      } else {
        setPageState("other");
      }
    });
  }, []);

  const toggleSidebar = async () => {
    setIsToggling(true);
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.id) {
        console.error("No active tab found");
        setIsToggling(false);
        return;
      }

      // Send message to content script to toggle sidebar
      chrome.tabs.sendMessage(
        currentTab.id,
        { type: "OPEN_SIDEBAR" },
        (response) => {
          console.info(response);
          // If no response, the content script might not be loaded
          if (chrome.runtime.lastError || !response) {
            console.log("Content script not responding, refreshing page...");
            // chrome.tabs.reload(currentTab.id!);
          } else {
            console.log("Sidebar toggled successfully");
            window.close(); // Close popup after toggling
          }
          setIsToggling(false);
        },
      );
    } catch (error) {
      console.error("Error toggling sidebar:", error);
      setIsToggling(false);
    }
  };

  const openLinkedIn = () => {
    chrome.tabs.create({ url: "https://www.linkedin.com" });
    window.close(); // Close popup after opening LinkedIn
  };

  const renderContent = () => {
    if (pageState === "loading") {
      return (
        <div className="min-w-64 p-4">
          <Loader2Icon className="mx-auto mb-4 animate-spin" />
        </div>
      );
    }

    if (pageState === "other") {
      return (
        <div>
          <p className="mb-4 text-center text-sm font-bold text-gray-800">
            Welcome to EngageKit, master!
          </p>
          <p className="mb-4 text-center text-sm">
            You must be on linkedin.com to use Engagekit
          </p>

          <Button onClick={openLinkedIn} className="w-full" variant="primary">
            Go to linkedin.com
          </Button>
        </div>
      );
    }

    return (
      <div>
        <p className="mb-4 text-center text-sm font-bold text-gray-800">
          Welcome to EngageKit, master!
        </p>
        <p className="mb-4 text-center text-sm">
          Use the button below to toggle Engagekit sidebar
        </p>
        <Button
          onClick={toggleSidebar}
          disabled={isToggling}
          className="w-full rounded-md"
          variant="primary"
        >
          {isToggling ? (
            <div className="grid place-items-center">
              <Loader2Icon className="animate-spin" />
            </div>
          ) : (
            "Open Sidebar"
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-w-64 p-4">
      <div className="grid place-items-center">
        <img src="/engagekit-logo.svg" alt="EngageKit" className="mb-2 w-12" />
      </div>

      {renderContent()}
    </div>
  );
}
