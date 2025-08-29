/// <reference types="chrome-types" />
import * as z from "zod/mini";

const STORAGE = chrome.storage.local;

const zDebug = z.boolean();
type Debug = z.infer<typeof zDebug>;

const DEFAULT_DEBUG = false;
const KEY = "settings";

let CURR: Debug = DEFAULT_DEBUG;

async function get(): Promise<Debug> {
  const items = await STORAGE.get(KEY);
  const raw: unknown = items[KEY];
  const result = zDebug.safeParse(raw);
  return result.success ? result.data : DEFAULT_DEBUG;
}

type Listener = () => void;
const LISTENERS = new Set<Listener>();

function watch(): void {
  // Ideally we would just await this, but because of [no-toplevel-await] this makes it awkward.
  void get().then((value) => {
    CURR = value;
  });

  STORAGE.onChanged.addListener((changes) => {
    const raw: unknown = changes[KEY].newValue;
    if (raw === undefined) {
      return;
    }
    const value = zDebug.safeParse(raw);
    if (value.success) {
      CURR = value.data;
      for (const listener of LISTENERS) {
        listener();
      }
    }
  });
}

watch();

export const debug = {
  get: (): Debug => {
    return CURR;
  },
  set: async (value: Debug): Promise<void> => {
    await STORAGE.set({ [KEY]: value });
  },
  sub: (listener: Listener): (() => void) => {
    LISTENERS.add(listener);
    return () => {
      LISTENERS.delete(listener);
    };
  },
};
