/** Entrypoint for the Chrome content_script. */

import { log } from "./logger";
import { extractSchedule } from "./parser";
import { debug } from "./storage/debug";
import type { Schedule } from "./types";
import { waitFor } from "./utils/wait-for";

/** Wraps the date display element. */
class DateDisplay {
  public readonly $element: Element;

  constructor(element: Element) {
    this.$element = element;
  }

  static find(): DateDisplay | undefined {
    const $elem = document.getElementById("myschedule.dateDisplay");
    return $elem ? new DateDisplay($elem) : undefined;
  }

  getMonth(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- False positive...
    const text = this.$element.textContent?.trim();
    return text || undefined;
  }
}

type DateDisplayObserverListeners = {
  onChange: () => void;
  onRemove: () => void;
};

/** Watches for updates to a {@link DateDisplay}'s `textContent`, or for deletion of the node. */
class DateDisplayObserver {
  private readonly observer: MutationObserver;

  constructor(
    dateDisplay: DateDisplay,
    listeners: DateDisplayObserverListeners,
  ) {
    const element = dateDisplay.$element;
    const observer = new MutationObserver((mutations, observer) => {
      for (const mutation of mutations) {
        if ([...mutation.removedNodes].includes(element)) {
          log("info", "(DateDisplayObserver)", "Date display removed");
          listeners.onRemove();
          observer.disconnect();
          return;
        }
      }
      listeners.onChange();
    });
    observer.observe(element, {
      subtree: true,
      childList: true,
    });
    this.observer = observer;
  }
}

class ExtensionBadge {
  public readonly $element: Element;

  constructor(element: Element) {
    this.$element = element;
  }

  static insert(dateDisplay: DateDisplay): ExtensionBadge {
    const $badge = document.createElement("span");
    dateDisplay.$element.parentElement?.append($badge);
    const self = new ExtensionBadge($badge);
    self.update(dateDisplay);
    return self;
  }

  destroy(): void {
    this.$element.remove();
  }

  update(dateDisplay: DateDisplay): void {
    this.$element.textContent = `🍪 🍪 🌀 ${dateDisplay.getMonth()}`;
  }
}

/** Watches for all updates to the document until a `DateDisplay` can be found. */
class DocumentObserver {
  private readonly observer: MutationObserver;

  constructor(onFound: (dateDisplay: DateDisplay) => void) {
    const observer = new MutationObserver((_mutations, observer) => {
      const dateDisplay = DateDisplay.find();
      if (dateDisplay) {
        log(
          "info",
          "(DocumentObserver)",
          "Found date display:",
          dateDisplay.$element,
        );
        onFound(dateDisplay);
        observer.disconnect();
      }
    });
    observer.observe(document, { subtree: true, childList: true });
    this.observer = observer;
  }
}

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
