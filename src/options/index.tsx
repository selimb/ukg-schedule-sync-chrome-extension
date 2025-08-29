import { Component, type ComponentChildren, render } from "preact";

import { AuthForm } from "./auth-form";
import { DebugForm } from "./debug-form";

class App extends Component {
  state: { error?: unknown } = { error: undefined };

  componentDidCatch(error: unknown): void {
    this.setState({ error });
  }

  render(): ComponentChildren {
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
  render(<App />, container);
} else {
  alert("No root container found.");
}
