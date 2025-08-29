import { type FC, useSyncExternalStore } from "preact/compat";

import { debug } from "../storage/debug";

export const DebugForm: FC = () => {
  const debugValue = useSyncExternalStore(debug.sub, debug.get);

  return (
    <form>
      <label>
        <input
          type="checkbox"
          name="debug"
          checked={debugValue}
          onChange={() => {
            void debug.set(!debugValue);
          }}
        />
        Debug
      </label>
    </form>
  );
};
