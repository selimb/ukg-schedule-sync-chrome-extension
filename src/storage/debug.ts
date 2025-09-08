/// <reference types="chrome-types" />
import * as z from "zod/mini";

const STORAGE = chrome.storage.local;
const KEY = "settings";

const zDebug = z.boolean();
type Debug = z.infer<typeof zDebug>;

const DEFAULT_DEBUG = false;

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
    if (!(KEY in changes)) {
      return;
    }
    const raw: unknown = changes[KEY].newValue;
    const value = zDebug.safeParse(raw);
    if (value.success) {
      CURR = value.data;
      for (const listener of LISTENERS) {
        listener();
      }
    }
    // TODO: Error-handling?
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
  listen: (listener: Listener): (() => void) => {
    LISTENERS.add(listener);
    return () => {
      LISTENERS.delete(listener);
    };
  },
};
