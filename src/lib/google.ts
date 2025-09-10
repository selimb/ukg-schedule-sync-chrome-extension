import * as z from "zod/mini";

const BASE_URL = new URL("https://www.googleapis.com");

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
};

type RequestInfo = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

type ResponseInfo = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

class RequestError extends Error {
  public readonly request: RequestInfo;
  public readonly response: ResponseInfo;

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

export const zCalendar = z.object({
  id: z.string(),
  summary: z.string(),
});
export type Calendar = z.infer<typeof zCalendar>;

export class GoogleClient {
  public readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request(options: RequestOptions): Promise<Response> {
    const { method, path, ..._rest } = options;
    const _exhaustiveCheck: Required<typeof _rest> = {};

    const url = new URL(path, BASE_URL);
    const headers = {
      Authorization: `Bearer ${this.token}`,
    };

    const resp = await fetch(url, {
      method,
      headers,
    });

    if (!resp.ok) {
      const requestInfo: RequestInfo = {
        url: url.toString(),
        method,
        headers,
      };
      const error = await RequestError.fromResponse(requestInfo, resp);
      throw error;
    }

    return resp;
  }

  async listCalendars(): Promise<Calendar[]> {
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
}
