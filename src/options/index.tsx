import { Component, type JSX } from "react";
import { createRoot } from "react-dom/client";

import { setEnvironment } from "../env";
import { AuthForm } from "./auth-form";
import { DebugForm } from "./debug-form";

setEnvironment("options");

class App extends Component {
  state: { error?: unknown } = { error: undefined };

  componentDidCatch(error: unknown): void {
    this.setState({ error });
  }

  render(): JSX.Element {
    const { error } = this.state;
    if (error !== undefined) {
      return <div>Oops, something went wrong.</div>;
    }

    return (
      <main>
        <h1>Authentication</h1>
        <AuthForm />
        <h1>Debug</h1>
        <DebugForm />
      </main>
    );
  }
}

const container = document.getElementById("root");
if (container) {
  const reactRoot = createRoot(container);
  reactRoot.render(<App />);
} else {
  alert("No root container found.");
}
