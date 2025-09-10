import * as z from "zod/mini";

import { zCalendar } from "../lib/google";
import { type StorageAreaKey, Store } from "./_common";

const AREA: StorageAreaKey = "local";
const KEY = "calendar";

export const calendarStore = new Store(AREA, KEY, z.nullable(zCalendar), null);
