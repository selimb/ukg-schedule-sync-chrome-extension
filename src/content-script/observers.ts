import { log } from "../logger";
import { DateDisplay } from "./date-display";

type Listener = () => void;
type Cleanup = () => void;

/** Watches for updates to a {@link DateDisplay}'s `textContent`, or for deletion of the node. */
export class DateDisplayObserver {
  private readonly observer: MutationObserver;
  private readonly listeners: {
    onChange: Set<Listener>;
    onRemove: Set<Listener>;
  } = {
    onChange: new Set(),
    onRemove: new Set(),
  };

  constructor(dateDisplay: DateDisplay) {
    const element = dateDisplay.$element;
    const observer = new MutationObserver((mutations, observer) => {
      for (const mutation of mutations) {
        if ([...mutation.removedNodes].includes(element)) {
          log("info", "(DateDisplayObserver)", "Date display removed");
          for (const listener of this.listeners.onRemove) {
            listener();
          }
          observer.disconnect();
          return;
        }
      }
      for (const listener of this.listeners.onChange) {
        listener();
      }
    });
    observer.observe(element, {
      subtree: true,
      childList: true,
    });
    this.observer = observer;
  }

  listenChange = (listener: Listener): Cleanup => {
    this.listeners.onChange.add(listener);
    return () => this.listeners.onChange.delete(listener);
  };

  listenRemove = (listener: Listener): Cleanup => {
    this.listeners.onRemove.add(listener);
    return () => this.listeners.onRemove.delete(listener);
  };
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
