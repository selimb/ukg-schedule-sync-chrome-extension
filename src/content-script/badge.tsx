import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState, useSyncExternalStore } from "react";

import { type AuthInfo, authManager } from "../auth-manager";
import { log } from "../logger";
import type { NaiveDatetime } from "../types";
import { DateDisplay } from "./date-display";
import { Modal, type ModalRef } from "./modal";
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

type UseAuthResult = ReturnType<typeof useAuth>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
function useAuth() {
  const queryClient = useQueryClient();
  const checkAuthKey = ["check-auth"] as const;
  type CheckAuthData = AuthInfo | null;

  const qCheckAuth = useQuery({
    queryKey: checkAuthKey,
    queryFn: async (): Promise<CheckAuthData> => {
      const auth = await authManager.checkAuth();
      console.info("checkAuth", auth);
      // eslint-disable-next-line unicorn/no-null -- Need null to workaround no-void-query-fn
      return auth ?? null;
    },
  });
  const promptAuth = useMutation({
    mutationFn: async () => {
      console.info("promptAuth...");
      return await authManager.promptAuth();
    },
    onSuccess: (auth) => {
      queryClient.setQueryData(checkAuthKey, auth satisfies CheckAuthData);
    },
  });

  return { qCheckAuth, promptAuth };
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
  qCheckAuth: UseAuthResult["qCheckAuth"],
): BadgeStatus {
  if (qSchedule.status === "error" || qCheckAuth.status === "error") {
    return { type: "error" };
  }
  if (qSchedule.status === "pending" || qCheckAuth.status === "pending") {
    return { type: "loading" };
  }
  const hasToken = qCheckAuth.data !== null;
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

  const qSchedule = useWaitSchedule({ month });
  const { qCheckAuth, promptAuth } = useAuth();

  const status = computeBadgeStatus(qSchedule, qCheckAuth);
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
        </div>
      </Modal>
    </>
  );
};

const AuthenticationDetails: React.FC<UseAuthResult> = ({
  qCheckAuth,
  promptAuth,
}) => {
  let icon: string;
  let body: React.ReactNode;

  switch (qCheckAuth.status) {
    case "pending": {
      icon = "⏳";
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = "❌";
      body = (
        <pre className="border whitespace-pre">
          {JSON.stringify(qCheckAuth.error, undefined, 4)}
        </pre>
      );
      break;
    }
    case "success": {
      const auth = qCheckAuth.data;
      if (auth) {
        icon = "✅";
        body = <p className="font-mono">{auth.profile.email}</p>;
      } else {
        icon = "⚠️";
        body = (
          <button
            className="cursor-pointer rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={promptAuth.isPending}
            onClick={() => {
              promptAuth.mutate();
            }}
            type="button"
          >
            Login
          </button>
        );
      }
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Authentication</span>

        <span>{icon}</span>
      </h2>

      {body}

      {promptAuth.error ? (
        <>
          <h3>Failed to Login</h3>

          <pre className="border whitespace-pre">
            {JSON.stringify(promptAuth.error, undefined, 4)}
          </pre>
        </>
      ) : undefined}
    </div>
  );
};

/**
 * Returns `date` as a YYYY-MM-DD HH:MM` string.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time#valid_datetime_values
 */
function dateToDateTimeString(date: NaiveDatetime): string {
  const year = date.year.toString();
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  const hour = date.hour.toString().padStart(2, "0");
  const minute = date.minute.toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

const ScheduleExtractionDetails: React.FC<{
  // Yeah yeah, we could `useWaitSchedule` here directly, but this is easier to follow.
  readonly qSchedule: UseWaitScheduleResult;
}> = ({ qSchedule }) => {
  const [expand, setExpand] = useState(false);

  let icon: string;
  let body: React.ReactNode;

  switch (qSchedule.status) {
    case "pending": {
      icon = "⏳";
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = "❌";
      body = (
        <pre className="border whitespace-pre">
          {JSON.stringify(qSchedule.error, undefined, 4)}
        </pre>
      );
      break;
    }
    case "success": {
      if (qSchedule.data instanceof Error) {
        icon = "⚠️";
        body = <p>Zero events found.</p>;
      } else {
        const schedule = qSchedule.data;
        icon = "✅";
        body = (
          <>
            <p>
              {"Found "}

              <button
                className="cursor-pointer underline"
                onClick={() => {
                  if (!expand) {
                    const formatted = schedule
                      .map((item) => {
                        const start = dateToDateTimeString(item.start);
                        const end = dateToDateTimeString(item.end);
                        return `${start} to ${end} - ${item.id}`;
                      })
                      .join("\n");
                    log("info", `schedule:\n${formatted}`);
                  }
                  setExpand((prev) => !prev);
                }}
                type="button"
              >
                {schedule.length}
              </button>

              {" events."}
            </p>

            {expand ? (
              <table className="w-full table-auto">
                <tbody>
                  {schedule.map((item) => (
                    <tr className="font-mono" key={item.id}>
                      <td>{item.id}</td>

                      {[item.start, item.end].map((dt) => {
                        const dateTime = dateToDateTimeString(dt);
                        return (
                          <td key={dateTime}>
                            <time dateTime={dateTime}>{dateTime}</time>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : undefined}
          </>
        );
      }
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Schedule Extraction</span>

        <span>{icon}</span>
      </h2>

      {body}
    </div>
  );
};
