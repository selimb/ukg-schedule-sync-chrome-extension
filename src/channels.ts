import * as z from "zod/mini";

import type { AuthInfo } from "./auth-manager";
import type { SyncCalendarResult } from "./lib/sync";
import { log } from "./logger";
import type { Schedule } from "./types";
import { formatError } from "./utils/format-error";

type MessageType = string;
type IMessage = Record<string, unknown> | undefined;

type ChannelMessageEnvelope<I extends IMessage> = {
  type: MessageType;
  data: I;
};

type ChannelResponseEnvelope<O extends IMessage = IMessage> =
  | {
      success: true;
      data: O;
    }
  | {
      success: false;
      error: string;
    };

const zChannelMessageEnvelope = z.object({
  type: z.string(),
  data: z.optional(z.looseObject({})),
});

/**
 * Interface for sending/receiving messages to/from the service worker.
 */
export type Channel<I extends IMessage, O extends IMessage> = {
  _input: I;
  _output: O;
  msgType: MessageType;
  send(message: I): Promise<O>;
};

function mkChannel<I extends IMessage, O extends IMessage>(
  msgType: string,
): Channel<I, O> {
  return {
    _input: undefined as never,
    _output: undefined as never,
    msgType,
    async send(message) {
      const envelope: ChannelMessageEnvelope<I> = {
        type: msgType,
        data: message,
      };
      log("debug", "channel.send", msgType, message);
      const responseEnvelope = (await chrome.runtime.sendMessage(
        envelope,
      )) as ChannelResponseEnvelope<O>;
      log("debug", "channel.recv", msgType, responseEnvelope);
      if (!responseEnvelope.success) {
        throw new Error(responseEnvelope.error);
      }
      return responseEnvelope.data;
    },
  };
}

export const channels = {
  checkAuth: mkChannel<undefined, { auth: AuthInfo | undefined }>("check-auth"),
  promptAuth: mkChannel<undefined, { auth: AuthInfo }>("prompt-auth"),
  openOptionsPage: mkChannel<undefined, undefined>("open-options-page"),
  syncCalendar: mkChannel<{ schedule: Schedule }, SyncCalendarResult>(
    "sync-calendar",
  ),
};

const channelKeyByType = Object.fromEntries(
  Object.entries(channels).map(([key, channel]) => [channel.msgType, key]),
);

type Channels = typeof channels;

type ChannelHandlers = {
  [K in keyof Channels]: (
    req: Channels[K]["_input"],
  ) => Promise<Channels[K]["_output"]>;
};

let didListen = false;

export function listenChannels(handlers: ChannelHandlers): void {
  if (didListen) {
    throw new Error("listenChannels should not be called more than once.");
  }

  chrome.runtime.onMessage.addListener(function messageHandler(
    message,
    _sender,
    sendResponse: (envelope: ChannelResponseEnvelope) => void,
  ) {
    const envelopeResult = zChannelMessageEnvelope.safeParse(message);
    if (!envelopeResult.success) {
      sendResponse({
        success: false,
        error: envelopeResult.error.message,
      });
      return;
    }

    const envelope = envelopeResult.data;
    const key = channelKeyByType[envelope.type] as keyof Channels | undefined;
    if (!key) {
      return;
    }

    const fn = handlers[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime safety.
    if (fn === undefined) {
      sendResponse({
        success: false,
        error: `No handler found for key '${key}'.`,
      });
      return;
    }
    const req = envelope.data as Channels[typeof key]["_input"];
    // Can't use `await` here.
    fn(req as never).then(
      (result) => {
        sendResponse({
          success: true,
          data: result,
        });
      },
      (error: unknown) => {
        log("error", "Channel handler error.", error);
        const errorMessage = formatError(error);
        sendResponse({ success: false, error: errorMessage });
      },
    );
    // Indicate that we will respond asynchronously.
    return true;
  });

  didListen = true;
}
