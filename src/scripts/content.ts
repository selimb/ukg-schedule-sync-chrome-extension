/** Entrypoint for the Chrome content_script. */

/** */
function log(...args: unknown[]): void {
  console.debug("[ukg-schedule-sync]", ...args);
}

/** Wraps the date display element. */
class DateDisplay {
  public readonly $element: Element;

  constructor(element: Element) {
    this.$element = element;
  }

  static find(): DateDisplay | undefined {
    // eslint-disable-next-line unicorn/prefer-query-selector -- Hush.
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
          log("(DateDisplayObserver)", "Date display removed");
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
        log("(DocumentObserver)", "Found date display:", dateDisplay.$element);
        onFound(dateDisplay);
        observer.disconnect();
      }
    });
    observer.observe(document, { subtree: true, childList: true });
    this.observer = observer;
  }
}

type ScheduleItem = {
  id: string;
  start: Date;
  end: Date;
};

type Schedule = ScheduleItem[];

function parseDatetimes(
  dateText: string,
  timeText: string,
): { start: Date; end: Date } | undefined {
  const [startText, endText] = timeText.split(" - ").map((s) => s.trim());
  if (!startText || !endText) {
    return undefined;
  }

  const startDate = new Date(`${dateText} ${startText}`);
  const endDate = new Date(`${dateText} ${endText}`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return undefined;
  }

  if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return { start: startDate, end: endDate };
}

function querySchedule(): Schedule {
  const $scheduleRoot = document.querySelector("krn-calendar");
  if (!$scheduleRoot) {
    log("No schedule root found.");
    return [];
  }

  const schedule: Schedule = [];
  for (const $event of $scheduleRoot.querySelectorAll("a.krn-calendar-event")) {
    // XXX
    log("$event:", $event);
    const id = $event.id;
    if (!id) {
      // XXX
      log("no id");
      continue;
    }

    const date = $event.getAttribute("data-date");
    if (!date) {
      // XXX
      log("no date");
      continue;
    }

    const $time = $event.querySelector(".fc-time");
    if (!$time) {
      // XXX
      log("no time element");
      continue;
    }

    const timeText = $time.textContent;
    if (!timeText) {
      // XXX
      log("no time text");
      continue;
    }

    const datetimes = parseDatetimes(date, timeText);
    if (!datetimes) {
      // XXX
      log("could not parse datetimes");
      continue;
    }

    schedule.push({
      id,
      start: datetimes.start,
      end: datetimes.end,
    });
  }

  log("schedule:", schedule);
  return schedule;
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

function update(dateDisplay?: DateDisplay): void {
  dateDisplay = dateDisplay ?? DateDisplay.find();

  if (!dateDisplay) {
    const documentObserver = new DocumentObserver((dateDisplay) => {
      update(dateDisplay);
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
  querySchedule();

  const dateDisplayObserver = new DateDisplayObserver(dateDisplay, {
    onChange: () => {
      extensionBadge.update(dateDisplay);
      querySchedule();
    },
    onRemove: () => {
      extensionBadge.destroy();
      update();
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
  update();
}

main();
