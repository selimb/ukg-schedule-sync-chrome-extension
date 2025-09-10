import type React from "react";

import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import type { UseSyncCalendarResult } from "./hooks";

export const SyncDetails: React.FC<{
  readonly qSyncCalendar: UseSyncCalendarResult;
}> = ({ qSyncCalendar }) => {
  let icon: string | undefined;
  let body: React.ReactNode;

  const { status } = qSyncCalendar;
  switch (status) {
    case "idle": {
      break;
    }
    case "error": {
      icon = Icon.error;
      body = (
        <div>
          <Button onClick={() => void qSyncCalendar.resync()} type="button">
            Retry
          </Button>

          <ErrorDetails error={qSyncCalendar.error} />
        </div>
      );
      break;
    }
    case "syncing": {
      icon = Icon.syncing;
      break;
    }
    case "should-sync": {
      icon = Icon.warning;
      body = (
        <Button onClick={() => void qSyncCalendar.resync()} type="button">
          Sync
        </Button>
      );

      break;
    }
    case "cache-hit":
    case "synced": {
      icon = Icon.ok;
      const text = `Last synced on ${formatLastSyncOn(qSyncCalendar.lastSyncOn)}`;
      body = (
        <div className="flex items-center gap-2">
          <span>{text}</span>

          <Button onClick={() => void qSyncCalendar.resync()} type="button">
            Resync
          </Button>
        </div>
      );
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Sync</span>

        {icon ? <span>{icon}</span> : undefined}
      </h2>

      {body}
    </div>
  );
};

function formatLastSyncOn(lastSyncOn: Date | undefined): string {
  if (!lastSyncOn) {
    return "?";
  }

  return lastSyncOn.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}
