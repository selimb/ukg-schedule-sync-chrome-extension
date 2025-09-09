import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { type FC, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { authManager } from "../auth-manager";
import { log } from "../logger";
import { debug } from "../storage/debug";
import type { Schedule } from "../types";
import { waitFor } from "../utils/wait-for";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver } from "./observers";
import { extractSchedule } from "./parser";

type UseWaitScheduleResult = ReturnType<typeof useWaitSchedule>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
function useWaitSchedule({ month }: { month: string | undefined }) {
  return useQuery({
    queryKey: ["schedule", month],
    queryFn: waitSchedule,
  });
}

type UseHasTokenResult = ReturnType<typeof useHasToken>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
function useHasToken() {
  return useQuery({
    queryKey: ["check-token"],
    queryFn: async () => {
      log("info", "query check-token...");
      const token = await authManager.checkToken();
      return !!token;
    },
  });
}

type BadgeStatus =
  | {
      type: "loading";
    }
  | {
      type: "warning";
      reason: "need-auth";
    }
  | {
      type: "error";
    }
  | { type: "syncing" }
  | {
      type: "ok";
    };

function computeBadgeStatus(
  qSchedule: UseWaitScheduleResult,
  qHasToken: UseHasTokenResult,
): BadgeStatus {
  if (qSchedule.status === "error" || qHasToken.status === "error") {
    return { type: "error" };
  }
  if (qSchedule.status === "pending" || qHasToken.status === "pending") {
    return { type: "loading" };
  }
  const hasToken = qHasToken.data;
  if (!hasToken) {
    return { type: "warning", reason: "need-auth" };
  }
  // XXX handle syncing
  return { type: "ok" };
}

function getIconProps(status: BadgeStatus): { title: string; icon: string } {
  switch (status.type) {
    case "loading": {
      return { title: "Loading...", icon: "⏳" };
    }
    case "warning": {
      return { title: "Authentication required", icon: "⚠️" };
    }
    case "error": {
      return { title: "Error", icon: "❌" };
    }
    case "syncing": {
      return { title: "Syncing...", icon: "🔄" };
    }
    case "ok": {
      return { title: "Up to date", icon: "✅" };
    }
  }
}

type BadgeProps = {
  dateDisplay: DateDisplay;
  dateDisplayObserver: DateDisplayObserver;
};

export const Badge: FC<BadgeProps> = ({ dateDisplay, dateDisplayObserver }) => {
  const month = useSyncExternalStore(
    dateDisplayObserver.listenChange,
    dateDisplay.getMonth,
  );

  const qSchedule = useWaitSchedule({ month });
  const qHasToken = useHasToken();

  const status = computeBadgeStatus(qSchedule, qHasToken);
  const iconProps = getIconProps(status);

  return (
    <span title={iconProps.title} className="btn">
      {iconProps.icon}
    </span>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: Infinity,
      retry: false,
    },
  },
});

async function waitSchedule(): Promise<Schedule | Error> {
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

const App: FC<BadgeProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Badge {...props} />
    </QueryClientProvider>
  );
};

export function renderBadge(
  dateDisplay: DateDisplay,
  dateDisplayObserver: DateDisplayObserver,
): void {
  const $parent = dateDisplay.$element.parentElement;
  if (!$parent) {
    throw new Error("Date display has no parent element");
  }
  const $root = document.createElement("ukg-schedule-sync");
  $parent.append($root);
  const reactRoot = createRoot($root);
  reactRoot.render(
    <App dateDisplay={dateDisplay} dateDisplayObserver={dateDisplayObserver} />,
  );

  dateDisplayObserver.listenRemove(() => {
    reactRoot.unmount();
    $root.remove();
  });
}
