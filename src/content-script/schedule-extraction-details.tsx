import React, { useState } from "react";

import { log } from "../logger";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import type { NaiveDate, NaiveDatetime } from "../types";
import type { UseWaitScheduleResult } from "./hooks";

export const ScheduleExtractionDetails: React.FC<{
  // Yeah yeah, we could `useWaitSchedule` here directly, but this is easier to follow.
  readonly qSchedule: UseWaitScheduleResult;
}> = ({ qSchedule }) => {
  const [expand, setExpand] = useState(false);

  let icon: string;
  let body: React.ReactNode;

  switch (qSchedule.status) {
    case "pending": {
      icon = Icon.loading;
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = Icon.error;
      body = <ErrorDetails error={qSchedule.error} />;
      break;
    }
    case "success": {
      if (qSchedule.data instanceof Error) {
        icon = Icon.warning;
        body = <p>Zero events found.</p>;
      } else {
        const schedule = qSchedule.data;
        icon = Icon.ok;
        body = (
          <>
            <p>
              {"Found "}

              <button
                className="cursor-pointer underline"
                onClick={() => {
                  if (!expand) {
                    const formatted = schedule.events
                      .map((item) => {
                        const start = dateToDateTimeString(item.start);
                        const end = dateToDateTimeString(item.end);
                        return `${start} to ${end} - ${item.id}`;
                      })
                      .join("\n");
                    log("info", `schedule:\n${formatted}`);
                  }
                  setExpand((prev) => !prev);
                }}
                type="button"
              >
                {schedule.events.length}
              </button>

              {" events from "}

              <span>{dateToDateString(schedule.bounds.start)}</span>

              {" to "}

              <span>{dateToDateString(schedule.bounds.start)}</span>
            </p>

            {expand ? (
              <table className="w-full table-auto">
                <tbody>
                  {schedule.events.map((item) => (
                    <tr className="font-mono" key={item.id}>
                      <td>{item.id}</td>

                      {[item.start, item.end].map((dt) => {
                        const dateTime = dateToDateTimeString(dt);
                        return (
                          <td key={dateTime}>
                            <time dateTime={dateTime}>{dateTime}</time>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : undefined}
          </>
        );
      }
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Schedule Extraction</span>

        <span>{icon}</span>
      </h2>

      {body}
    </div>
  );
};

function dateToDateString(date: NaiveDate): string {
  const year = date.year.toString();
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns `date` as a YYYY-MM-DD HH:MM` string.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time#valid_datetime_values
 */
export function dateToDateTimeString(date: NaiveDatetime): string {
  const year = date.year.toString();
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  const hour = date.hour.toString().padStart(2, "0");
  const minute = date.minute.toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
