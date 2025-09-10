import { describe, expect, test } from "bun:test";

import { testExports } from "./sync";

const { naiveDateToDate, naiveDatetimeToDate } = testExports;

describe(naiveDateToDate, () => {
  test("daylight savings", () => {
    const date = naiveDateToDate({ year: 2024, month: 6, day: 15 });
    expect(date.toISOString()).toBe("2024-06-15T04:00:00.000Z");
  });

  test("standard time", () => {
    const date = naiveDateToDate({ year: 2024, month: 1, day: 15 });
    expect(date.toISOString()).toBe("2024-01-15T05:00:00.000Z");
  });

  test("add one day", () => {
    const date = naiveDateToDate({ year: 2024, month: 1, day: 32 });
    expect(date.toISOString()).toBe("2024-02-01T05:00:00.000Z");
  });
});

describe(naiveDatetimeToDate, () => {
  test("daylight savings", () => {
    const date = naiveDatetimeToDate({
      year: 2024,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
    });
    expect(date.toISOString()).toBe("2024-06-15T16:30:00.000Z");
  });

  test("standard time", () => {
    const date = naiveDatetimeToDate({
      year: 2024,
      month: 1,
      day: 15,
      hour: 12,
      minute: 30,
    });
    expect(date.toISOString()).toBe("2024-01-15T17:30:00.000Z");
  });
});
