import * as z from "zod/mini";

import { log } from "./logger";
import type { AuthToken } from "./storage/auth";

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
      const responseEnvelope = (await chrome.runtime.sendMessage(
        envelope,
      )) as ChannelResponseEnvelope<O>;
      if (!responseEnvelope.success) {
        throw new Error(responseEnvelope.error);
      }
      return responseEnvelope.data;
    },
  };
}

export const channels = {
  checkAuthToken: mkChannel<undefined, { token: AuthToken | undefined }>(
    "check-auth-token",
  ),
  promptToken: mkChannel<undefined, { token: AuthToken }>("get-auth-token"),
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
      return;
    }

    const envelope = envelopeResult.data;
    const key = channelKeyByType[envelope.type] as keyof Channels | undefined;
    if (!key) {
      return;
    }

    const fn = handlers[key];
    const req = envelope.data as Channels[typeof key]["_input"];
    // Can't use `await` here.
    fn(req).then(
      (result) => {
        sendResponse({
          success: true,
          data: result,
        });
      },
      (error: unknown) => {
        log("error", "Channel handler error", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        sendResponse({ success: false, error: errorMessage });
      },
    );
    // Indicate that we will respond asynchronously.
    return true;
  });

  didListen = true;
}
