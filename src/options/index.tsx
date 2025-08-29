import { render } from "preact";
import type { FC } from "preact/compat";

import { DebugForm } from "./debug-form";

const App: FC = () => {
  return (
    <main>
      <h1>Debug</h1>
      <DebugForm />
    </main>
  );
};

const container = document.getElementById("root");
if (container) {
  render(<App />, container);
} else {
  alert("No root container found.");
}
