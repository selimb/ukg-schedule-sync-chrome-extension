import { authManager } from "./auth-manager";
import { listenChannels } from "./channels";
import { setEnvironment } from "./env";

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
});
chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
