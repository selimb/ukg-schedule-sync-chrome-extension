/** Entrypoint for the Chrome content_script. */

import { log } from "../logger";
import { extractSchedule } from "../parser";
import { debug } from "../storage/debug";
import type { Schedule } from "../types";
import { waitFor } from "../utils/wait-for";
import { ExtensionBadge } from "./badge";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver, DocumentObserver } from "./observers";

type State = {
  dateDisplay: DateDisplay | undefined;
  documentObserver: DocumentObserver | undefined;
  dateDisplayObserver: DateDisplayObserver | undefined;
  extensionBadge: ExtensionBadge | undefined;
};

let STATE: State = {
  dateDisplay: undefined,
  documentObserver: undefined,
  dateDisplayObserver: undefined,
  extensionBadge: undefined,
};

async function waitSchedule(): Promise<Schedule | undefined> {
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
  } else {
    log("warn", "No schedule found.");
  }
  return schedule;
}

async function update(dateDisplay?: DateDisplay): Promise<void> {
  dateDisplay = dateDisplay ?? DateDisplay.find();

  if (!dateDisplay) {
    const documentObserver = new DocumentObserver((dateDisplay) => {
      void update(dateDisplay);
    });

    STATE = {
      dateDisplay: undefined,
      dateDisplayObserver: undefined,
      extensionBadge: undefined,
      documentObserver,
    };

    return;
  }

  // XXX Show indicator when auth is required.
  const extensionBadge = ExtensionBadge.insert(dateDisplay);
  // XXX: Handle.
  const schedule = await waitSchedule();

  const dateDisplayObserver = new DateDisplayObserver(dateDisplay, {
    onChange: () => {
      extensionBadge.update(dateDisplay);
      // XXX: Handle.
      void waitSchedule();
    },
    onRemove: () => {
      extensionBadge.destroy();
      void update();
    },
  });

  STATE = {
    dateDisplay,
    dateDisplayObserver,
    extensionBadge,
    documentObserver: undefined,
  };
}

function main(): void {
  void update();
}

main();
