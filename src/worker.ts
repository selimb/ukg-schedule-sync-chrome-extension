import { authManager } from "./auth-manager";
import { listenChannels } from "./channels";
import { setEnvironment } from "./env";
import { GoogleClient } from "./lib/google";
import { syncCalendar } from "./lib/sync";
import { log } from "./logger";
import { preloadStores } from "./storage";
import { calendarStore } from "./storage/calendar";

setEnvironment("service-worker");

async function main(): Promise<void> {
  chrome.action.onClicked.addListener(() => {
    void chrome.runtime.openOptionsPage();
  });

  await preloadStores();

  listenChannels({
    checkAuth: async function checkAuthToken() {
      const auth = await authManager.checkAuth();
      return { auth };
    },
    promptAuth: async function getAuthToken() {
      const auth = await authManager.promptAuth();
      return { auth };
    },
    openOptionsPage: async function openOptionsPage() {
      await chrome.runtime.openOptionsPage();
    },
    syncCalendar: async function recvSyncCalendar({ schedule }) {
      const auth = await authManager.checkAuth();
      if (!auth?.token.token) {
        throw new Error("Missing authentication.");
      }
      const googleClient = new GoogleClient(auth.token.token);

      const calendar = calendarStore.get();
      if (!calendar) {
        throw new Error("Missing calendar in store.");
      }

      return await syncCalendar({
        calendarId: calendar.id,
        googleClient,
        schedule,
      });
    },
  });

  log("info", "Service worker is ready");
}

void main();
