import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Component, type JSX } from "react";
import { createRoot } from "react-dom/client";

import { setEnvironment } from "../env";
import { log } from "../logger";
import { preloadStores } from "../storage";
import { AuthForm } from "./auth-form";
import { CalendarForm } from "./calendar-form";
import { ConfigForm } from "./config-form";
import { DebugForm } from "./debug-form";

setEnvironment("options");

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

class App extends Component {
  // eslint-disable-next-line react/state-in-constructor -- Huh?
  state: { error?: unknown };

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- This is what we want.
  constructor(props: {}) {
    super(props);
    this.state = { error: undefined };
  }

  shouldComponentUpdate(): boolean {
    return true;
  }

  static getDerivedStateFromError(error: unknown): App["state"] {
    return { error };
  }

  render(): JSX.Element {
    const { error } = this.state;
    if (error !== undefined) {
      return <div>Oops, something went wrong.</div>;
    }

    return (
      <main className="space-y-2 p-4">
        <DebugForm />

        <ConfigForm />

        <AuthForm />

        <CalendarForm />
      </main>
    );
  }
}

async function main(): Promise<void> {
  await preloadStores();

  const container = document.getElementById("root");
  if (container) {
    const reactRoot = createRoot(container);
    reactRoot.render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );
  } else {
    alert("No root container found.");
  }
}

void main();
