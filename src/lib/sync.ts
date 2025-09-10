import { fromZonedTime } from "date-fns-tz";

import { log } from "../logger";
import { debug } from "../storage/debug";
import type { NaiveDate, Schedule, ScheduleEvent } from "../types";
import type { Calendar, GoogleClient } from "./google";

// TODO: Configurable?
/**
 * The timezone of the schedule in UKG.
 */
const SCHEDULE_TIMEZONE = "America/Toronto";

export type SyncCalendarResult = {
  created: number;
  updated: number;
  deleted: number;
};

export async function syncCalendar(input: {
  googleClient: GoogleClient;
  calendarId: Calendar["id"];
  schedule: Schedule;
}): Promise<SyncCalendarResult> {
  const { googleClient, calendarId, schedule } = input;

  const scheduleEventsById = new Map<ScheduleEvent["id"], ScheduleEvent>();
  for (const event of schedule.events) {
    scheduleEventsById.set(event.id, event);
  }

  let created = 0;
  let updated = 0;
  let deleted = 0;

  const eventsExisting = await googleClient.listEvents({
    calendarId,
    min: naiveDateToDate(schedule.bounds.start),
    // Add one day to include events on the end date.
    max: naiveDateToDate({
      ...schedule.bounds.end,
      day: schedule.bounds.end.day + 1,
    }),
  });

  if (debug.get()) {
    log(
      "debug",
      `Fetched ${eventsExisting.length} GCal events:`,
      eventsExisting,
    );
  } else {
    log("info", `Fetched ${eventsExisting.length} GCal events.`);
  }

  return { created, updated, deleted };
}

function naiveDateToDate(date: NaiveDate): Date {
  return fromZonedTime(
    Date.UTC(date.year, date.month - 1, date.day),
    SCHEDULE_TIMEZONE,
  );
}

export const testExports = {
  naiveDateToDate,
};
