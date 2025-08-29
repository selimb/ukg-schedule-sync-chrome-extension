const STORAGE = chrome.storage.local;
const KEY = "auth";

export const authStore = {
  get: async (): Promise<chrome.identity.GetAuthTokenResult | undefined> => {
    const items = await STORAGE.get(KEY);
    return items[KEY] as chrome.identity.GetAuthTokenResult | undefined;
  },
  set: async (token: chrome.identity.GetAuthTokenResult): Promise<void> => {
    await STORAGE.set({ [KEY]: token });
  },
  reset: async (): Promise<void> => {
    await STORAGE.remove(KEY);
  },
};
