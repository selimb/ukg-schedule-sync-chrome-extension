import { calendarStore } from "./calendar";
import { configStore } from "./config";
import { debug } from "./debug";
import { syncCache } from "./sync-cache";

/**
 * Preloads values for all stores.
 * This avoids fiddling with `useQuery` just to get stores.
 */
export async function preloadStores(): Promise<void> {
  // TODO: Could only preload the stores we know we're gonna need, but it's not like
  // this is super expensive anyway.
  await debug.load();
  await calendarStore.load();
  await syncCache.load();
  await configStore.load();
}
