import type React from "react";

import { Icon } from "../shared/icons";
import type { UseSyncCalendarResult } from "./hooks";

export const SyncDetails: React.FC<{
  readonly qSyncCalendar: UseSyncCalendarResult;
}> = ({ qSyncCalendar }) => {
  let icon: string | undefined;
  let body: React.ReactNode;

  switch (qSyncCalendar.status) {
    case "pending": {
      icon = qSyncCalendar.isFetching ? Icon.loading : Icon.warning;
      // Otherwise, don't show anything.
      break;
    }
  }
};
