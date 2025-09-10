import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { FC } from "react";
import { createRoot } from "react-dom/client";

import { log } from "../logger";
import { Badge, type BadgeProps } from "./badge";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver } from "./observers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: Infinity,
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError(error, query) {
      log("error", "[query error]", query.queryKey, error);
    },
  }),
});

const App: FC<BadgeProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Badge {...props} />
    </QueryClientProvider>
  );
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
  const shadow = $root.attachShadow({ mode: "open" });
  $parent.append($root);

  const $link = document.createElement("link");
  $link.setAttribute("rel", "stylesheet");
  $link.setAttribute(
    "href",
    chrome.runtime.getURL("dist/ukg-schedule-sync.css"),
  );
  shadow.append($link);

  const $reactRoot = document.createElement("span");
  shadow.append($reactRoot);

  const reactRoot = createRoot($reactRoot);
  reactRoot.render(
    <App dateDisplay={dateDisplay} dateDisplayObserver={dateDisplayObserver} />,
  );

  dateDisplayObserver.listenRemove(() => {
    reactRoot.unmount();
    $root.remove();
  });
}
