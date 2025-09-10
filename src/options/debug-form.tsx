import { type FC, useSyncExternalStore } from "react";

import { debug } from "../storage/debug";

export const DebugForm: FC = () => {
  const debugValue = useSyncExternalStore(debug.listen, debug.get);

  return (
    <section>
      <h1 className="text-lg">Debug</h1>

      <form>
        <label className="flex items-center gap-2">
          <input
            checked={debugValue}
            name="debug"
            onChange={() => {
              void debug.set(!debugValue);
            }}
            type="checkbox"
          />

          <span>Debug</span>
        </label>
      </form>
    </section>
  );
};
