import * as z from "zod/mini";

import { log } from "../logger";
import { debug } from "../storage/debug";

const BASE_URL = new URL("https://www.googleapis.com");

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  query?: URLSearchParams;
  json?: unknown;
};

type RequestInfo = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
};

type ResponseInfo = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

class RequestError extends Error {
  public readonly request: RequestInfo;
  public readonly response: ResponseInfo;
  public override readonly name = "RequestError";

  constructor(message: string, request: RequestInfo, response: ResponseInfo) {
    super(message);
    this.request = request;
    this.response = response;
  }

  static async fromResponse(
    request: RequestInfo,
    response: Response,
  ): Promise<RequestError> {
    const responseText = await response.text();
    let body: unknown = responseText;
    try {
      body = JSON.parse(responseText);
    } catch {
      // Not JSON.
    }

    return new RequestError(
      `Request failed with status ${response.status}`,
      request,
      {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
      },
    );
  }
}

const zCalendarId = z.string();
export const zCalendar = z.object({
  id: zCalendarId,
  summary: z.string(),
});
export type Calendar = z.infer<typeof zCalendar>;

export const zCalendarEvent = z.object({
  id: z.string(),
  summary: z.nullish(z.string()),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.nullish(z.string()),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.nullish(z.string()),
  }),
});
export type CalendarEvent = z.infer<typeof zCalendarEvent>;

export type InsertEventInput = {
  calendarId: Calendar["id"];
  event: CalendarEvent;
};

export class GoogleClient {
  public readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request(options: RequestOptions): Promise<Response> {
    const { method, path, query, json, ..._rest } = options;
    const _exhaustiveCheck: Required<typeof _rest> = {};

    const url = new URL(path, BASE_URL);
    if (query) {
      url.search = query.toString();
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    let body: string | undefined;
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    }

    const requestInfo: RequestInfo = {
      url: url.toString(),
      method,
      headers,
      body: json,
    };

    const resp = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!resp.ok) {
      const error = await RequestError.fromResponse(requestInfo, resp);
      throw error;
    }

    if (debug.get()) {
      log("debug", "GoogleClient.request", requestInfo, resp.status);
    }

    return resp;
  }

  async listCalendars(): Promise<Calendar[]> {
    // TODO [pagination] In practice we probably won't have enough calendars though.
    const resp = await this.request({
      method: "GET",
      path: "calendar/v3/users/me/calendarList",
    });
    const data: unknown = await resp.json();
    const schema = z.object({
      items: z.array(zCalendar),
    });
    const parsed = schema.parse(data);
    return parsed.items;
  }

  async listEvents(input: {
    calendarId: Calendar["id"];
    min: Date;
    max: Date;
  }): Promise<CalendarEvent[]> {
    const { calendarId, min, max } = input;

    const query = new URLSearchParams({
      timeMin: min.toISOString(),
      timeMax: max.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    // TODO [pagination] The default page size is 250, which is more than enough.
    const path = `calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const resp = await this.request({
      method: "GET",
      path,
      query,
    });
    const data: unknown = await resp.json();
    const schema = z.object({
      items: z.array(zCalendarEvent),
    });
    const parsed = schema.parse(data);
    return parsed.items;
  }

  async insertEvent(input: InsertEventInput): Promise<void> {
    const { calendarId, event } = input;

    const path = `calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    await this.request({
      method: "POST",
      path,
      json: event,
    });
  }

  async updateEvent(input: InsertEventInput): Promise<void> {
    const { calendarId, event } = input;

    const path = `calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.id)}`;
    await this.request({
      method: "PUT",
      path,
      json: event,
    });
  }

  async upsertEvent(
    input: InsertEventInput,
    options: { tryFirst: "insert" | "update" },
  ): Promise<"inserted" | "updated"> {
    switch (options.tryFirst) {
      case "insert": {
        try {
          await this.insertEvent(input);
          return "inserted";
        } catch (error) {
          if (error instanceof RequestError && error.response.status === 409) {
            await this.updateEvent(input);
            return "updated";
          }
          throw error;
        }
      }
      case "update": {
        try {
          await this.updateEvent(input);
          return "updated";
        } catch (error) {
          if (error instanceof RequestError && error.response.status === 404) {
            await this.insertEvent(input);
            return "inserted";
          }
          throw error;
        }
      }
    }
  }

  async deleteEvent(input: {
    calendarId: Calendar["id"];
    eventId: CalendarEvent["id"];
  }): Promise<boolean> {
    const { calendarId, eventId } = input;

    const path = `calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    try {
      await this.request({
        method: "DELETE",
        path,
      });
      return true;
    } catch (error) {
      if (error instanceof RequestError && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
