/** Entrypoint for the Chrome content_script. */

import { setEnvironment } from "../env";
import { log } from "../logger";
import { debug } from "../storage/debug";
import type { Schedule } from "../types";
import { waitFor } from "../utils/wait-for";
import { renderBadge } from "./badge";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver, DocumentObserver } from "./observers";
import { extractSchedule } from "./parser";

setEnvironment("content-script");

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
    const _documentObserver = new DocumentObserver((dateDisplay) => {
      void update(dateDisplay);
    });

    return;
  }

  const dateDisplayObserver = new DateDisplayObserver(dateDisplay);
  dateDisplayObserver.listenRemove(() => {
    void update();
  });

  renderBadge(dateDisplay, dateDisplayObserver);

  // XXX: Handle.
  const schedule = await waitSchedule();
}

function main(): void {
  void update();
}

main();
