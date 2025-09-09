import { useQuery } from "@tanstack/react-query";
import { type FC, useSyncExternalStore } from "react";

import { authManager } from "../auth-manager";
import { log } from "../logger";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver } from "./observers";
import { waitSchedule } from "./parser";

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

export type BadgeProps = {
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
    <button title={iconProps.title} className="text-lg">
      {iconProps.icon}
    </button>
  );
};
