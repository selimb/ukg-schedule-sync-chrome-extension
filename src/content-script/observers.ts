import { log } from "../logger";
import { DateDisplay } from "./date-display";

type DateDisplayObserverListeners = {
  onChange?: () => void;
  onRemove?: () => void;
};

/** Watches for updates to a {@link DateDisplay}'s `textContent`, or for deletion of the node. */
export class DateDisplayObserver {
  private readonly observer: MutationObserver;
  private readonly listeners: DateDisplayObserverListeners[] = [];

  constructor(dateDisplay: DateDisplay) {
    const element = dateDisplay.$element;
    const observer = new MutationObserver((mutations, observer) => {
      for (const mutation of mutations) {
        if ([...mutation.removedNodes].includes(element)) {
          log("info", "(DateDisplayObserver)", "Date display removed");
          for (const listener of this.listeners) {
            listener.onRemove?.();
          }
          observer.disconnect();
          return;
        }
      }
      for (const listener of this.listeners) {
        listener.onChange?.();
      }
    });
    observer.observe(element, {
      subtree: true,
      childList: true,
    });
    this.observer = observer;
  }

  addListener(listener: DateDisplayObserverListeners): void {
    this.listeners.push(listener);
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
