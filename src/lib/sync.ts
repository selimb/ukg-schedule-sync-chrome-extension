import { fromZonedTime } from "date-fns-tz";

import { log } from "../logger";
import { debug } from "../storage/debug";
import type {
  NaiveDate,
  NaiveDatetime,
  Schedule,
  ScheduleEvent,
} from "../types";
import {
  type Calendar,
  type CalendarEvent,
  type GoogleClient,
  zCalendarEvent,
} from "./google";

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

  const required = schedule.events.map(buildGoogleEvent);

  // NOTE: Items are deleted from this map as we match them.
  const existingMap = await fetchCalendarEvents(
    googleClient,
    calendarId,
    schedule.bounds,
  );

  let created = 0;
  let updated = 0;
  let deleted = 0;

  // TODO: Concurrent requests, but meh for now.
  for (const requiredEvent of required) {
    const id = requiredEvent.id;
    const existingEvent = existingMap.get(id);
    let tryFirst: "update" | "insert";
    if (existingEvent) {
      existingMap.delete(id);
      if (compareGoogleEvents(existingEvent, requiredEvent)) {
        continue;
      }
      tryFirst = "update";
    } else {
      tryFirst = "insert";
    }

    const result = await googleClient.upsertEvent(
      { calendarId, event: requiredEvent },
      { tryFirst },
    );
    switch (result) {
      case "inserted": {
        ++created;
        break;
      }
      case "updated": {
        ++updated;
        break;
      }
    }
  }

  for (const remaining of existingMap.values()) {
    const didDelete = await googleClient.deleteEvent({
      calendarId,
      eventId: remaining.id,
    });
    if (didDelete) {
      ++deleted;
    }
  }

  return { created, updated, deleted };
}

type CalendarEventMap = Map<CalendarEvent["id"], CalendarEvent>;

async function fetchCalendarEvents(
  googleClient: GoogleClient,
  calendarId: Calendar["id"],
  bounds: Schedule["bounds"],
): Promise<CalendarEventMap> {
  const eventsExisting = await googleClient.listEvents({
    calendarId,
    min: naiveDateToDate(bounds.start),
    // Add one day to include events on the end date.
    max: naiveDateToDate({
      ...bounds.end,
      day: bounds.end.day + 1,
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

  const map: CalendarEventMap = new Map();
  for (const event of eventsExisting) {
    map.set(event.id, event);
  }
  return map;
}

const GGOGLE_EVENT_ID_REPLACE_REGEX = /[^a-z0-9]/gi;

function buildGoogleEvent(event: ScheduleEvent): CalendarEvent {
  const googleId = event.id
    .toLowerCase()
    .replaceAll(GGOGLE_EVENT_ID_REPLACE_REGEX, "");
  return {
    id: googleId,
    summary: "Shift",
    start: {
      dateTime: naiveDatetimeToDate(event.start).toISOString(),
    },
    end: {
      dateTime: naiveDatetimeToDate(event.end).toISOString(),
    },
  };
}

function compareGoogleEvents(a: CalendarEvent, b: CalendarEvent): boolean {
  // Parse both using zod because that generates a stable representation.
  const aString = JSON.stringify(zCalendarEvent.parse(a));
  const bString = JSON.stringify(zCalendarEvent.parse(b));
  return aString === bString;
}

function naiveDateToDate(date: NaiveDate): Date {
  return fromZonedTime(
    Date.UTC(date.year, date.month - 1, date.day),
    SCHEDULE_TIMEZONE,
  );
}

function naiveDatetimeToDate(dt: NaiveDatetime): Date {
  return fromZonedTime(
    Date.UTC(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute),
    SCHEDULE_TIMEZONE,
  );
}

export const testExports = {
  naiveDateToDate,
  naiveDatetimeToDate,
};
