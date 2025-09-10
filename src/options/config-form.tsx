import { type FC, useSyncExternalStore } from "react";

import { configStore } from "../storage/config";

export const DebugForm: FC = () => {
  const config = useSyncExternalStore(configStore.listen, configStore.get);

  return (
    <section>
      <h1 className="text-lg">Config</h1>

      <form>
        <label className="flex items-center gap-2">
          <input
            checked={config.autoSync}
            name="auto-sync"
            onChange={() => {
              void configStore.update({ autoSync: !config.autoSync });
            }}
            type="checkbox"
          />

          <span>Auto-Sync</span>
        </label>
      </form>
    </section>
  );
};
