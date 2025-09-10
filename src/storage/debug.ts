import * as z from "zod/mini";

import { type StorageAreaKey, Store } from "./_common";

const AREA: StorageAreaKey = "local";
const KEY = "debug";

const zDebug = z.boolean();

export const debug = new Store(AREA, KEY, zDebug, false);
