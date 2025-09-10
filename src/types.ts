export type MonthString = string;

export type NaiveDate = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
};

export type NaiveTime = {
  hour: number; // 0-23
  minute: number; // 0-59
};

export type NaiveDatetime = NaiveDate & NaiveTime;

export type ScheduleEvent = {
  /** This looks like `event-transfershift-4745823`. */
  id: string;
  start: NaiveDatetime;
  end: NaiveDatetime;
  /** Timestamp, only used for sorting. */
  sortKey: number;
};

export type Schedule = {
  /**
   * [schedule-sort] The events are always ordered by start time.
   */
  events: ScheduleEvent[];
  bounds: {
    start: NaiveDate;
    end: NaiveDate;
  };
};

export type Etag = string;

export type ScheduleWithEtag = {
  schedule: Schedule;
  etag: Etag;
};
