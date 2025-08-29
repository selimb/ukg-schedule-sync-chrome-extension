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

export type ScheduleItem = {
  id: string;
  start: NaiveDatetime;
  end: NaiveDatetime;
};

export type Schedule = ScheduleItem[];
