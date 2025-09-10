import { channels } from "../channels";
import { Button } from "../shared/button";
import { Icon } from "../shared/icons";
import type { UseCalendarStoreResult } from "./hooks";

export const CalendarStoreDetails: React.FC<{
  readonly calendar: UseCalendarStoreResult;
}> = ({ calendar }) => {
  let icon: string | undefined;
  let body: React.ReactNode;

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
