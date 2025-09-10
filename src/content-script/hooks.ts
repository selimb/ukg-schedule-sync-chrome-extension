import { skipToken, useQuery } from "@tanstack/react-query";

import { channels } from "../channels";
import { calendarStore } from "../storage/calendar";
import type { Schedule } from "../types";
import { waitSchedule } from "./parser";

export type UseWaitScheduleResult = ReturnType<typeof useWaitSchedule>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useWaitSchedule({ month }: { month: string | undefined }) {
  return useQuery({
    queryKey: ["schedule", month],
    queryFn: waitSchedule,
  });
}

export type UseCalendarStoreResult = ReturnType<typeof useCalendarStore>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useCalendarStore() {
  return useQuery({
    queryKey: ["calendar"],
    // eslint-disable-next-line unicorn/no-null -- Workaround.
    queryFn: async () => (await calendarStore.get()) ?? null,
  });
}

export type UseSyncCalendarResult = ReturnType<typeof useSyncCalendar>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useSyncCalendar({
  month,
  schedule,
}: {
  month: string | undefined;
  schedule: Schedule | undefined;
}) {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- `schedule` should not be there.
    queryKey: ["sync", month],
    queryFn:
      month && schedule
        ? async () => {
            await channels.syncCalendar.send({ schedule });
          }
        : skipToken,
  });
}
