import * as z from "zod/mini";

import type { Etag, MonthString, Schedule } from "../types";
import { hashObject } from "../utils/hash-object";
import { type StorageAreaKey, Store } from "./_common";

const AREA: StorageAreaKey = "local";
const KEY = "sync-cache";

// 1 day
const TTL: number = 1000 * 60 * 60 * 24;

const zMonth = z.string() satisfies z.ZodMiniType<MonthString>;

const zCacheEntry = z.object({
  etag: z.string() satisfies z.ZodMiniType<Etag>,
  // `chrome.storage` doesn't serialize `Date` :/
  syncedOn: z.iso.datetime(),
});
export type SyncCacheEntry = {
  etag: Etag;
  syncedOn: Date;
};

const zSyncCache = z.record(zMonth, zCacheEntry);
type SyncCacheData = z.infer<typeof zSyncCache>;

const syncCacheStore = new Store(AREA, KEY, zSyncCache, {});

export class SyncCache {
  private get map(): SyncCacheData {
    return syncCacheStore.get();
  }

  public load = async (): Promise<void> => {
    await syncCacheStore.load();
  };

  /** For `useSyncExternalStore`. */
  public get = (): this => this;
  /** For `useSyncExternalStore`. */
  public listen = (listener: () => void): (() => void) => {
    return syncCacheStore.listen(listener);
  };

  public getEntry = ({
    month,
  }: {
    month: MonthString;
  }): SyncCacheEntry | undefined => {
    // Damn Typescript, why do you assume it's never undefined?
    // Could use an actual `Map`, but then we'd have to convert to/from object for storage.
    const entry = this.map[month] as z.infer<typeof zCacheEntry> | undefined;
    return entry
      ? { etag: entry.etag, syncedOn: new Date(entry.syncedOn) }
      : undefined;
  };

  public isExpired(entry: SyncCacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.syncedOn.getTime();
    return age > TTL;
  }

  public async add({
    month,
    etag,
  }: {
    month: MonthString;
    etag: Etag;
  }): Promise<void> {
    const now = new Date();
    const mapNew: typeof this.map = {
      ...this.map,
      [month]: { etag, syncedOn: now.toISOString() },
    };
    await syncCacheStore.set(mapNew);
  }
}

export const syncCache = new SyncCache();

export async function hashSchedule(schedule: Schedule): Promise<Etag> {
  // Thanks to [schedule-sort], this should be stable.
  return await hashObject(schedule);
}
