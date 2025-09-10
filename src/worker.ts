import { authManager } from "./auth-manager";
import { listenChannels } from "./channels";
import { setEnvironment } from "./env";
import { GoogleClient } from "./lib/google";
import { syncCalendar as doSyncCalendar } from "./lib/sync";
import { calendarStore } from "./storage/calendar";

setEnvironment("service-worker");

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
  syncCalendar: async function syncCalendar({ schedule }) {
    const auth = await authManager.checkAuth();
    if (!auth?.token.token) {
      throw new Error("Missing authentication.");
    }
    const ooogleClient = new GoogleClient(auth.token.token);

    const calendar = await calendarStore.load();
    if (!calendar) {
      throw new Error("Missing calendar in store.");
    }

    return await doSyncCalendar({
      calendarId: calendar.id,
      googleClient: ooogleClient,
      schedule,
    });
  },
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
