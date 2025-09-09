// XXX Delete
/**
 * Storage of the auth token.
 * Chrome has its own storage, but it's opaque.
 */

const STORAGE = chrome.storage.local;
const KEY = "auth";

type Listener = (token: AuthToken | undefined) => void;
const LISTENERS = new Set<Listener>();

function watch(): void {
  STORAGE.onChanged.addListener((changes) => {
    if (!(KEY in changes)) {
      return;
    }
    const token = changes[KEY].newValue as AuthToken | undefined;
    for (const listener of LISTENERS) {
      listener(token);
    }
  });
}

watch();

export const authStore = {
  get: async (): Promise<AuthToken | undefined> => {
    const items = await STORAGE.get(KEY);
    return items[KEY] as AuthToken | undefined;
  },
  set: async (token: AuthToken): Promise<void> => {
    await STORAGE.set({ [KEY]: token });
  },
  reset: async (): Promise<void> => {
    await STORAGE.remove(KEY);
  },
  listen: (listener: Listener): (() => void) => {
    LISTENERS.add(listener);
    return () => {
      LISTENERS.delete(listener);
    };
  },
};
