import { skipToken, useQuery } from "@tanstack/react-query";
import { type FC, useState, useSyncExternalStore } from "react";

import type { Calendar } from "../lib/google";
import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import { useGoogleClient } from "../shared/use-google-client";
import { calendarStore } from "../storage/calendar";

export const CalendarForm: FC = () => {
  const calendar = useSyncExternalStore(
    calendarStore.listen,
    calendarStore.get,
  );
  const hasCalendar = calendar !== null;
  const calendarListEnabled = !hasCalendar;

  const googleClient = useGoogleClient();

  const qCalendarList = useQuery({
    queryKey: ["calendar-list"],
    queryFn:
      googleClient && calendarListEnabled
        ? async () => await googleClient.listCalendars()
        : skipToken,
  });

  let icon: string;
  let body: React.ReactNode;

  if (calendarListEnabled && qCalendarList.status === "pending") {
    icon = Icon.loading;
    body = <p>Loading...</p>;
  } else if (qCalendarList.status === "error") {
    const error = qCalendarList.error;
    icon = Icon.error;
    body = <ErrorDetails error={error} />;
  } else {
    if (calendar === null) {
      icon = Icon.warning;

      body = (
        <CalendarPicker
          // SAFETY: qCalendarList.data should always be defined at this point.
          //   Typescript doesn't think so because of `calendarListEnabled`, but
          //  `calendarListEnabled` will always be true if `calendar` is null.
          calendars={qCalendarList.data ?? []}
          onSubmit={(calendar) => {
            void calendarStore.set(calendar);
          }}
        />
      );
    } else {
      icon = Icon.ok;
      body = (
        <>
          <p className="font-mono">{calendar.summary}</p>

          <Button
            onClick={() => {
              void calendarStore.set(null);
            }}
            type="button"
          >
            Clear
          </Button>
        </>
      );
    }
  }

  return (
    <section>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Calendar</span>

        {icon ? <span>{icon}</span> : undefined}
      </h2>

      {body}
    </section>
  );
};

type CalendarPickerProps = {
  readonly calendars: Calendar[];
  readonly onSubmit: (calendar: Calendar) => void;
};

const CalendarPicker: FC<CalendarPickerProps> = ({ calendars, onSubmit }) => {
  const [selected, setSelected] = useState<Calendar>();

  if (calendars.length === 0) {
    return <p>No calendars found.</p>;
  }

  return (
    <form className="space-y-2">
      <ul>
        {calendars.map((calendar) => (
          <li key={calendar.id}>
            <label className="flex items-center gap-2">
              <input
                checked={selected?.id === calendar.id}
                name="calendar"
                onChange={() => {
                  setSelected((selected) =>
                    selected?.id === calendar.id ? undefined : calendar,
                  );
                }}
                type="checkbox"
              />

              <span>{calendar.summary}</span>
            </label>
          </li>
        ))}
      </ul>

      <Button
        disabled={selected === undefined}
        onClick={(e) => {
          e.preventDefault();
          if (selected) {
            onSubmit(selected);
          }
        }}
        type="submit"
      >
        Select
      </Button>
    </form>
  );
};
