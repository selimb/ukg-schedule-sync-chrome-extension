import { log } from "../logger";
import type { ScheduleWithEtag } from "../types";
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

/**
 * Watches `$scheduleRoot`, calling `fn` on every change.
 * Once the `etag` stabilizes for `stableMs` milliseconds, then this returns the result.
 */
export async function waitScheduleStable(
  $scheduleRoot: Element,
  fn: () => Promise<ScheduleWithEtag | undefined>,
  options: { maxWaitMs: number; stableMs: number },
): Promise<ScheduleWithEtag | undefined> {
  const { maxWaitMs, stableMs } = options;

  let stableTimeoutHandle: NodeJS.Timeout | undefined;
  let resultLast = await fn();

  return await new Promise<ScheduleWithEtag | undefined>((resolve, reject) => {
    const resolveStable = (result: ScheduleWithEtag): void => {
      stableTimeoutHandle = setTimeout(() => {
        clearTimeout(maxTimeoutHandle);
        observer.disconnect();
        resolve(result);
      }, stableMs);
    };

    const handleChange = async (): Promise<void> => {
      try {
        var result = await fn();
      } catch (error) {
        clearTimeout(maxTimeoutHandle);
        observer.disconnect();
        reject(error as Error);
        return;
      }

      if (resultLast && result && result.etag === resultLast.etag) {
        return;
      }

      clearTimeout(stableTimeoutHandle);
      resultLast = result;
      if (result) {
        resolveStable(result);
      }
    };

    const observer = new MutationObserver(() => {
      void handleChange();
    });

    observer.observe($scheduleRoot, { subtree: true, childList: true });

    const maxTimeoutHandle = setTimeout(() => {
      clearTimeout(stableTimeoutHandle);
      observer.disconnect();
      resolve(resultLast);
    }, maxWaitMs);

    if (resultLast) {
      resolveStable(resultLast);
    }
  });
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
