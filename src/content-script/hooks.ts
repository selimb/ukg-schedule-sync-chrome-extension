import { skipToken, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { channels } from "../channels";
import type { Calendar } from "../lib/google";
import { log } from "../logger";
import { calendarStore } from "../storage/calendar";
import { configStore } from "../storage/config";
import { syncCache } from "../storage/sync-cache";
import type { MonthString, ScheduleWithEtag } from "../types";
import { waitSchedule } from "./parser";

export type UseWaitScheduleResult = ReturnType<typeof useWaitSchedule>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useWaitSchedule({ month }: { month: MonthString | undefined }) {
  return useQuery({
    queryKey: ["schedule", month],
    queryFn: waitSchedule,
  });
}

export type UseCalendarStoreResult = ReturnType<typeof useCalendarStore>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useCalendarStore() {
  return useSyncExternalStore(calendarStore.listen, calendarStore.get);
}

type Resync = () => Promise<void>;

export type UseSyncCalendarResult =
  | {
      status: "idle";
    }
  | {
      status: "error";
      error: unknown;
      resync: Resync;
    }
  | {
      status: "cache-hit";
      /** `undefined` should never happen. */
      lastSyncOn: Date | undefined;
      resync: Resync;
    }
  | {
      status: "should-sync";
      lastSyncOn: Date | undefined;
      resync: Resync;
    }
  | { status: "syncing" }
  | {
      status: "synced";
      lastSyncOn: Date;
      resync: Resync;
    };

export function useSyncCalendar({
  month,
  scheduleWithEtag,
  calendarId,
}: {
  month: MonthString | undefined;
  scheduleWithEtag: ScheduleWithEtag | undefined;
  calendarId: Calendar["id"] | undefined;
}): UseSyncCalendarResult {
  // Re-render on updates to syncCache.
  useSyncExternalStore(syncCache.listen, syncCache.get);
  const { autoSync } = useSyncExternalStore(
    configStore.listen,
    configStore.get,
  );

  let canSync = false;
  let shouldSync = false;
  let lastSyncOn: Date | undefined;
  if (month && scheduleWithEtag && calendarId) {
    canSync = true;
    const cacheEntry = syncCache.getEntry({ month });
    if (cacheEntry) {
      lastSyncOn = cacheEntry.syncedOn;
      shouldSync =
        syncCache.isExpired(cacheEntry) ||
        cacheEntry.etag !== scheduleWithEtag.etag;
    } else {
      shouldSync = true;
    }
  }

  const qSync = useQuery({
    // This query should automatically re-run when either the `month` or `scheduleEtag` changes.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- Ditto.
    queryKey: ["sync", month, scheduleWithEtag?.etag],
    queryFn:
      month && scheduleWithEtag
        ? async () => {
            const { schedule, etag } = scheduleWithEtag;
            const result = await channels.syncCalendar.send({
              schedule,
            });
            log("info", "syncCalendar result:", result);
            await syncCache.add({ month, etag });
            return result;
          }
        : skipToken,
    enabled: shouldSync && autoSync,
  });

  const resync = async (): Promise<void> => {
    await qSync.refetch();
  };

  if (qSync.status === "error") {
    return {
      status: "error",
      error: qSync.error,
      resync,
    };
  }

  if (!canSync) {
    return { status: "idle" };
  }
  // If we can sync but should not sync, then we must've hit the cache.
  if (!shouldSync) {
    return {
      status: "cache-hit",
      lastSyncOn,
      resync,
    };
  }

  // At this point, we know that we should sync (or already did).
  if (qSync.status === "success") {
    return {
      status: "synced",
      lastSyncOn: new Date(qSync.dataUpdatedAt),
      resync,
    };
  }

  if (qSync.fetchStatus === "fetching") {
    return { status: "syncing" };
  }

  // In theory we should only reach here if `autoSync` is off.
  return { status: "should-sync", lastSyncOn, resync };
}
