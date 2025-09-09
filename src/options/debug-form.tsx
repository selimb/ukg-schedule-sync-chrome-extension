import { type FC, useSyncExternalStore } from "react";

import { debug } from "../storage/debug";

export const DebugForm: FC = () => {
  const debugValue = useSyncExternalStore(debug.listen, debug.get);

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
