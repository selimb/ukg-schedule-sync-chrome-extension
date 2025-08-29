import { log } from "../logger";
import { DateDisplay } from "./date-display";

type DateDisplayObserverListeners = {
  onChange: () => void;
  onRemove: () => void;
};

/** Watches for updates to a {@link DateDisplay}'s `textContent`, or for deletion of the node. */
export class DateDisplayObserver {
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

/** Watches for all updates to the document until a `DateDisplay` can be found. */
export class DocumentObserver {
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
