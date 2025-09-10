import { channels } from "../channels";
import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import type { UseCalendarStoreResult } from "./hooks";

export const CalendarStoreDetails: React.FC<{
  readonly qCalendarStore: UseCalendarStoreResult;
}> = ({ qCalendarStore }) => {
  let icon: string | undefined;
  let body: React.ReactNode;

  switch (qCalendarStore.status) {
    case "pending": {
      icon = Icon.loading;
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = Icon.error;
      body = <ErrorDetails error={qCalendarStore.error} />;
      break;
    }
    case "success": {
      const calendar = qCalendarStore.data;
      const button = (
        <Button
          onClick={() => {
            void channels.openOptionsPage.send(undefined);
          }}
          type="button"
        >
          Configure
        </Button>
      );
      if (calendar === null) {
        icon = Icon.warning;
        body = button;
      } else {
        icon = Icon.ok;
        body = (
          <>
            <p className="font-mono">{calendar.summary}</p>

            {button}
          </>
        );
      }
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Calendar</span>

        {icon ? <span>{icon}</span> : undefined}
      </h2>

      {body}
    </div>
  );
};
