import { skipToken, useQuery } from "@tanstack/react-query";
import { type FC, useState } from "react";

import type { Calendar } from "../lib/google";
import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import { useGoogleClient } from "../shared/use-google-client";
import { calendarStore } from "../storage/calendar";

export const CalendarForm: FC = () => {
  const qCalendarStore = useQuery({
    queryKey: ["calendar"],
    // eslint-disable-next-line unicorn/no-null -- Workaround.
    queryFn: async () => (await calendarStore.get()) ?? null,
  });

  const hasCalendar = qCalendarStore.data !== null;
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

  if (
    qCalendarStore.status === "pending" ||
    (calendarListEnabled && qCalendarList.status === "pending")
  ) {
    icon = Icon.loading;
    body = <p>Loading...</p>;
  } else if (
    qCalendarStore.status === "error" ||
    qCalendarList.status === "error"
  ) {
    const error = qCalendarStore.error ?? qCalendarList.error;
    icon = Icon.error;
    body = <ErrorDetails error={error} />;
  } else {
    const calendar = qCalendarStore.data;
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
            void qCalendarStore.refetch();
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
              void calendarStore.reset();
              void qCalendarStore.refetch();
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
