/// <reference types="chrome-types" />
import * as z from "zod/mini";

const StorageArea = {
  local: chrome.storage.local,
  sync: chrome.storage.sync,
};
export type StorageAreaKey = keyof typeof StorageArea;

type Listener<T> = (value: T) => void;

/**
 * Generic interface over `chrome.storage`.
 *
 * Exposes a sync interface for convenience, along with an interface compatible
 * with `useSyncExternalStore`; see {@link get} and {@link listen}.
 */
export class Store<T> {
  public readonly key: string;
  public readonly schema: z.ZodMiniType<T>;
  public readonly defaultValue: T;
  private curr: T;
  private storage: chrome.storage.StorageArea;
  private listeners = new Set<Listener<T>>();
  private didWatch = false;
  private didLoad = false;

  constructor(
    area: StorageAreaKey,
    key: string,
    schema: z.ZodMiniType<T>,
    defaultValue: T,
  ) {
    this.key = key;
    this.schema = schema;
    this.defaultValue = defaultValue;
    this.curr = defaultValue;
    this.storage = StorageArea[area];
  }

  /** Preloads the current value from storage. */
  public load = async (): Promise<T> => {
    if (this.didLoad) {
      return this.curr;
    }
    // TODO: Technically we could query all storage keys at once, but meh.
    const items = await this.storage.get(this.key);
    const raw: unknown = items[this.key];
    this.curr = this.parse(raw);
    this.didLoad = true;
    return this.curr;
  };

  public get = (): T => {
    this.ensureWatch();
    return this.curr;
  };

  public listen = (listener: Listener<T>): (() => void) => {
    this.ensureWatch();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public set = async (value: T): Promise<void> => {
    this.ensureWatch();
    this.curr = value;
    await this.storage.set({ [this.key]: value });
  };

  private ensureWatch(): void {
    if (this.didWatch) {
      return;
    }
    this.watch();
    this.didWatch = true;
  }

  private watch(): void {
    const key = this.key;
    // TODO: Technically we could setup a single shared listener, but meh.
    this.storage.onChanged.addListener((changes) => {
      if (!(key in changes)) {
        return;
      }

      const raw: unknown = changes[key].newValue;
      const value = this.parse(raw);
      this.curr = value;
      for (const listener of this.listeners) {
        listener(value);
      }
    });
  }

  private parse(raw: unknown): T {
    if (raw === undefined) {
      return this.defaultValue;
    }
    const result = this.schema.safeParse(raw);
    // TODO: Error-handling?
    return result.success ? result.data : this.defaultValue;
  }
}
