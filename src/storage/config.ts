import * as z from "zod/mini";

import { type StorageAreaKey, Store } from "./_common";

const AREA: StorageAreaKey = "local";
const KEY = "config";

const zConfig = z.object({
  autoSync: z._default(z.boolean(), false),
});
const DEFAULT_CONFIG: Config = zConfig.parse(
  {} satisfies z.input<typeof zConfig>,
);
export type Config = z.infer<typeof zConfig>;

class ConfigStore extends Store<Config> {
  constructor() {
    super(AREA, KEY, zConfig, DEFAULT_CONFIG);
  }

  public async update(data: Partial<Config>): Promise<void> {
    const configNew = { ...this.get(), ...data };
    await this.set(configNew);
  }
}

export const configStore = new ConfigStore();
