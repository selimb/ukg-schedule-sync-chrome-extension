const fakeStorage: Partial<typeof chrome.storage.local> = {
  get: async () => await Promise.resolve({}),
  set: async () => {
    await Promise.resolve(undefined);
  },
};

globalThis.chrome = {
  storage: {
    local: fakeStorage as never,
    session: fakeStorage as never,
    sync: fakeStorage as never,
    managed: fakeStorage as never,
    onChanged: undefined as never,
  },
} as never;
