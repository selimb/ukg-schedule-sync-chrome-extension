import React, { useRef, useSyncExternalStore } from "react";

import { Icon } from "../shared/icons";
import { useAuth, type UseAuthResult } from "../shared/use-auth";
import type { Schedule } from "../types";
import { AuthenticationDetails } from "./auth-details";
import { CalendarStoreDetails } from "./calendar-store-details";
import { DateDisplay } from "./date-display";
import {
  useCalendarStore,
  type UseCalendarStoreResult,
  useSyncCalendar,
  useWaitSchedule,
  type UseWaitScheduleResult,
} from "./hooks";
import { Modal, type ModalRef } from "./modal";
import { DateDisplayObserver } from "./observers";
import { ScheduleExtractionDetails } from "./schedule-extraction-details";
import { SyncDetails } from "./sync-details";

type BadgeStatus =
  | {
      type: "loading";
    }
  | {
      type: "warning";
      reason: "need-auth" | "need-calendar";
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
  qCheckAuth: UseAuthResult["qCheckAuth"],
  qCalendarStore: UseCalendarStoreResult,
): BadgeStatus {
  if (
    qSchedule.status === "error" ||
    qCheckAuth.status === "error" ||
    qCalendarStore.status === "error"
  ) {
    return { type: "error" };
  }
  if (
    qSchedule.status === "pending" ||
    qCheckAuth.status === "pending" ||
    qCalendarStore.status === "pending"
  ) {
    return { type: "loading" };
  }
  const hasToken = qCheckAuth.data !== null;
  if (!hasToken) {
    return { type: "warning", reason: "need-auth" };
  }
  const hasCalendar = qCalendarStore.data !== null;
  if (!hasCalendar) {
    return { type: "warning", reason: "need-calendar" };
  }
  // XXX handle syncing
  return { type: "ok" };
}

function getIconProps(status: BadgeStatus): { title: string; icon: string } {
  switch (status.type) {
    case "loading": {
      return { title: "Loading...", icon: Icon.loading };
    }
    case "warning": {
      switch (status.reason) {
        case "need-auth": {
          return { title: "Authentication required", icon: Icon.warning };
        }
        case "need-calendar": {
          return { title: "Calendar not set", icon: Icon.warning };
        }
      }
      break;
    }
    case "error": {
      return { title: "Error", icon: Icon.error };
    }
    case "syncing": {
      return { title: "Syncing...", icon: Icon.syncing };
    }
    case "ok": {
      return { title: "Up to date", icon: Icon.ok };
    }
  }
}

export type BadgeProps = {
  readonly dateDisplay: DateDisplay;
  readonly dateDisplayObserver: DateDisplayObserver;
};

export const Badge: React.FC<BadgeProps> = ({
  dateDisplay,
  dateDisplayObserver,
}) => {
  const month = useSyncExternalStore(
    dateDisplayObserver.listenChange,
    dateDisplay.getMonth,
  );
  const badgeDialogRef = useRef<ModalRef>(null);

  const { qCheckAuth, promptAuth } = useAuth();
  const qSchedule = useWaitSchedule({ month });
  const qCalendarStore = useCalendarStore();
  const schedule: Schedule | undefined =
    qSchedule.data instanceof Error ? undefined : qSchedule.data;
  const qSyncCalendar = useSyncCalendar({ month, schedule });

  const status = computeBadgeStatus(qSchedule, qCheckAuth, qCalendarStore);
  const iconProps = getIconProps(status);

  return (
    <>
      <button
        className="cursor-pointer text-lg"
        onClick={() => {
          badgeDialogRef.current?.open();
        }}
        title={iconProps.title}
        type="button"
      >
        {iconProps.icon}
      </button>

      <Modal header="UKG Schedule Sync" ref={badgeDialogRef}>
        <div className="space-y-4 p-4">
          <AuthenticationDetails
            promptAuth={promptAuth}
            qCheckAuth={qCheckAuth}
          />

          <ScheduleExtractionDetails qSchedule={qSchedule} />

          <CalendarStoreDetails qCalendarStore={qCalendarStore} />

          <SyncDetails qSyncCalendar={qSyncCalendar} />
        </div>
      </Modal>
    </>
  );
};
