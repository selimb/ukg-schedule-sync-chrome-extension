import { debug } from "./storage/debug";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_PREFIX = "[ukg-schedule-sync]";

export function log(level: LogLevel, ...args: unknown[]): void {
  if (level === "debug" && !debug.get()) {
    return;
  }

  // eslint-disable-next-line no-console -- This is fine.
  console[level](LOG_PREFIX, ...args);
}
