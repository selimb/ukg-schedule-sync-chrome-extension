import { authManager } from "./auth-manager";
import { listenChannels } from "./channels";
import { setEnvironment } from "./env";

setEnvironment("service-worker");

listenChannels({
  checkAuthToken: async function checkAuthToken() {
    const token = await authManager.checkToken();
    return { token };
  },
  promptToken: async function getAuthToken() {
    const token = await authManager.promptToken();
    return { token };
  },
});
chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
