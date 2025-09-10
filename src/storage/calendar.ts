/// <reference types="chrome-types" />
import { type Calendar, zCalendar } from "../lib/google";

const STORAGE = chrome.storage.local;
const KEY = "calendar";

type Listener = (calendar: Calendar | undefined) => void;
const LISTENERS = new Set<Listener>();

let didWatch = false;

function watch(): void {
  if (didWatch) {
    return;
  }
  didWatch = true;

  STORAGE.onChanged.addListener((changes) => {
    if (!(KEY in changes)) {
      return;
    }
    const raw: unknown = changes[KEY].newValue;
    let value: Calendar | undefined;
    if (raw === undefined) {
      value = undefined;
    } else {
      const result = zCalendar.safeParse(raw);
      value = result.success ? result.data : undefined;
    }
    for (const listener of LISTENERS) {
      listener(value);
    }
  });
}

export const calendarStore = {
  get: async (): Promise<Calendar | undefined> => {
    const items = await STORAGE.get(KEY);
    const raw: unknown = items[KEY];
    if (raw === undefined) {
      return undefined;
    }
    const result = zCalendar.safeParse(raw);
    return result.success ? result.data : undefined;
  },
  set: async (value: Calendar): Promise<void> => {
    await STORAGE.set({ [KEY]: value });
  },
  reset: async (): Promise<void> => {
    await STORAGE.remove(KEY);
  },
  listen: (listener: Listener): (() => void) => {
    watch();
    LISTENERS.add(listener);
    return () => {
      LISTENERS.delete(listener);
    };
  },
};
