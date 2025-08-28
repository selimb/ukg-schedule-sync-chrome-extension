import { render } from "preact";
import type { FC } from "preact/compat";

const App: FC = () => {
  return <div>Options Page</div>;
};

const container = document.getElementById("root");
if (container) {
  render(<App />, container);
} else {
  alert("No root container found.");
}
