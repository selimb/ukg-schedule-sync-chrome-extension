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

  switch (qSyncCalendar.status) {
    case "idle": {
      break;
    }
    case "pending": {
      icon = Icon.loading;
      break;
    }
    case "error": {
      icon = Icon.error;
      body = <ErrorDetails error={qSyncCalendar.error} />;
      break;
    }
    case "syncing": {
      icon = Icon.syncing;
      break;
    }
    case "cache-hit":
    case "synced": {
      icon = Icon.ok;
      const syncedOn =
        qSyncCalendar.status === "synced"
          ? "just now"
          : `on ${formatLastSyncOn(qSyncCalendar.lastSyncOn)}`;
      body = (
        <div className="flex items-center gap-2">
          <span>Synced {syncedOn}</span>

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
