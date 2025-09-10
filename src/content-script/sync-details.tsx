import type React from "react";

import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import type { UseSyncCalendarResult } from "./hooks";

export const SyncDetails: React.FC<{
  readonly qSyncCalendar: UseSyncCalendarResult;
}> = ({ qSyncCalendar }) => {
  let icon: string | undefined;
  let body: React.ReactNode;

  switch (qSyncCalendar.status) {
    case "pending": {
      // If not isFetching, then this is idle, which means something else is preventing sync.
      icon = qSyncCalendar.isFetching ? Icon.loading : Icon.warning;
      break;
    }
    case "error": {
      icon = Icon.error;
      console.info("calendar error", qSyncCalendar.error);
      body = <ErrorDetails error={qSyncCalendar.error} />;
      break;
    }
    case "success": {
      icon = Icon.ok;
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
