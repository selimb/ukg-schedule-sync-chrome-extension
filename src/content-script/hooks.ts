import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { channels } from "../channels";
import type { Calendar } from "../lib/google";
import { calendarStore } from "../storage/calendar";
import { configStore } from "../storage/config";
import { hashSchedule, syncCache } from "../storage/sync-cache";
import type { MonthString, Schedule } from "../types";
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
      status: "pending";
    }
  | {
      status: "error";
      error: unknown;
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
  schedule,
  calendarId,
}: {
  month: MonthString | undefined;
  schedule: Schedule | undefined;
  calendarId: Calendar["id"] | undefined;
}): UseSyncCalendarResult {
  // Re-render on updates to syncCache.
  useSyncExternalStore(syncCache.listen, syncCache.get);
  const { autoSync } = useSyncExternalStore(
    configStore.listen,
    configStore.get,
  );

  const qScheduleEtag = useAsyncMemo("schedule-etag", schedule, hashSchedule);
  const scheduleEtag = qScheduleEtag.data;

  let canSync = false;
  let shouldSync = false;
  let lastSyncOn: Date | undefined;
  if (month && scheduleEtag && calendarId) {
    canSync = true;
    const cacheEntry = syncCache.getEntry({ month });
    if (cacheEntry) {
      lastSyncOn = cacheEntry.syncedOn;
      shouldSync =
        syncCache.isExpired(cacheEntry) || cacheEntry.etag !== scheduleEtag;
    } else {
      shouldSync = true;
    }
  }

  const qSync = useQuery({
    // This query should automatically re-run when either the `month` or `scheduleEtag` changes.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- Ditto.
    queryKey: ["sync", month, scheduleEtag],
    queryFn:
      month && schedule && scheduleEtag && shouldSync
        ? async () => {
            await channels.syncCalendar.send({ schedule });
            await syncCache.add({ month, etag: scheduleEtag });
          }
        : skipToken,
    enabled: autoSync,
  });

  const resync = async (): Promise<void> => {
    await qSync.refetch();
  };

  if (qScheduleEtag.status === "error" || qSync.status === "error") {
    return {
      status: "error",
      error: qScheduleEtag.error ?? qSync.error,
    };
  }

  if (qScheduleEtag.status === "pending") {
    return { status: "pending" };
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
function useAsyncMemo<I, O>(
  queryKey: string,
  value: I | undefined,
  fn: (value: I) => Promise<O>,
) {
  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- Nope.
    queryKey: [queryKey],
    queryFn:
      value === undefined
        ? skipToken
        : async () => {
            return await fn(value);
          },
    // Always disabled. We run this ourselves in `useEffect`.
    enabled: false,
  });
  const refetch = query.refetch;
  // Will trigger when `value` changes.
  useEffect(() => {
    if (value !== undefined) {
      void refetch();
    }
  }, [value, refetch]);

  return query;
}
