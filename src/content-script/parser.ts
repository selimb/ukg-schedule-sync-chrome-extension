/**
 * DOM parsing utilities.
 */
import { log } from "../logger";
import { debug } from "../storage/debug";
import type { NaiveDate, NaiveTime, Schedule, ScheduleItem } from "../types";
import { waitFor } from "../utils/wait-for";

/** Runs {@link extractSchedule} with retries. */
export async function waitSchedule(): Promise<Schedule | Error> {
  const schedule = await waitFor(
    () => {
      const schedule = extractSchedule();
      return schedule.length > 0 ? schedule : undefined;
    },
    { intervalMs: 100, abort: AbortSignal.timeout(5000) },
  );

  if (schedule) {
    if (debug.get()) {
      log("debug", `Extracted ${schedule.length} schedule items:`, schedule);
    } else {
      log("info", `Extracted ${schedule.length} schedule items.`);
    }
    return schedule;
  } else {
    const error = new Error("No schedule found");
    log("warn", error.message);
    return error;
  }
}

/**
 * Extracts a schedule from the DOM.
 */
export function extractSchedule(): Schedule {
  const $scheduleRoot = document.querySelector("krn-calendar");
  if (!$scheduleRoot) {
    log("warn", "No schedule root found.");
    return [];
  }

  const schedule: Schedule = [];
  for (const $event of $scheduleRoot.querySelectorAll("a.krn-calendar-event")) {
    const item = parseEvent($event);
    if (item) {
      schedule.push(item);
    }
  }
  schedule.sort((a, b) => a.sortKey - b.sortKey);

  return schedule;
}

function parseEvent($event: Element): ScheduleItem | undefined {
  const id = $event.id;
  if (!id) {
    return;
  }

  // This will usually be set for Stat Holidays.
  // The time span is even hidden with CSS:
  //   .calendar-event-paycodeedit .fc-time {
  //     display: none;
  //   }
  if ($event.classList.contains("calendar-event-paycodeedit")) {
    return;
  }

  const dateString = $event.getAttribute("data-date");
  if (!dateString) {
    return;
  }

  const $time = $event.querySelector(".fc-time");
  if (!$time) {
    return;
  }

  const timeRangeText = $time.textContent;
  if (!timeRangeText) {
    return;
  }

  const date = parseDate(dateString);
  if (!date) {
    log("warn", "Could not parse date from", dateString);
    return;
  }

  const times = parseTimes(timeRangeText);
  if (!times) {
    log("warn", "Could not parse times from", timeRangeText);
    return;
  }

  if (times.end.hour === 0) {
    times.end.hour = 24;
  }

  const timestampUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    times.start.hour,
    times.start.minute,
  );

  return {
    id,
    start: { ...date, ...times.start },
    end: { ...date, ...times.end },
    sortKey: timestampUtc,
  };
}

/**
 * Parses a date string like `2025-09-15`.
 */
function parseDate(dateText: string): NaiveDate | undefined {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  // [date-wtf] Use UTC methods, since `new Date` assumes UTC midnight for this format.
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * Parses a time string like `1:00 pm - 8:30 pm`.
 */
function parseTimes(
  timeText: string,
): { start: NaiveTime; end: NaiveTime } | undefined {
  const parts = timeText.split(" - ").map((s) => s.trim());
  if (parts.length !== 2) {
    return undefined;
  }
  if (parts.some((s) => s.length === 0)) {
    return undefined;
  }

  const [start, end] = parts.map((t): NaiveTime | undefined => {
    const date = new Date(`1970-01-01 ${t}`);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    // [date-wtf] In this case, `new Date` assumes local timezone 🤦
    return { hour: date.getHours(), minute: date.getMinutes() };
  });

  if (!start || !end) {
    return undefined;
  }
  return { start, end };
}
