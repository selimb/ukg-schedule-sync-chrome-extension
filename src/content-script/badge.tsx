import { render } from "preact";
import { type FC, useSyncExternalStore } from "preact/compat";

import { DateDisplay } from "./date-display";
import { DateDisplayObserver } from "./observers";

// XXX Show indicator when auth is required.
export const Badge: FC<{
  dateDisplay: DateDisplay;
  dateDisplayObserver: DateDisplayObserver;
}> = ({ dateDisplay, dateDisplayObserver }) => {
  const month = useSyncExternalStore(
    dateDisplayObserver.listenChange,
    dateDisplay.getMonth,
  );

  return <span>🍪 {month}</span>;
};

export function renderBadge(
  dateDisplay: DateDisplay,
  dateDisplayObserver: DateDisplayObserver,
): void {
  const $parent = dateDisplay.$element.parentElement;
  if (!$parent) {
    throw new Error("Date display has no parent element");
  }
  const $root = document.createElement("ukg-schedule-sync");
  $parent.append($root);

  render(
    <Badge
      dateDisplay={dateDisplay}
      dateDisplayObserver={dateDisplayObserver}
    />,
    $root,
  );

  dateDisplayObserver.listenRemove(() => {
    render(undefined, $root);
    $root.remove();
  });
}
