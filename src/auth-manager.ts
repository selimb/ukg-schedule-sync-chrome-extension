import { channels } from "./channels";
import { env } from "./env";
import { log } from "./logger";
import { asyncDedup } from "./utils/async-dedup";

type Token = chrome.identity.GetAuthTokenResult;

type AuthManagerStatus = "initial" | "need-token" | "ready";

/**
 * Manages the chrome identity token.
 */
export class AuthManager {
  /** This token is guaranteed to be valid. */
  private _token: Token | undefined;
  private _status: AuthManagerStatus = "initial";

  constructor() {
    this.checkToken = asyncDedup(this.checkToken.bind(this));
    this.promptToken = asyncDedup(this.promptToken.bind(this));
  }

  get status(): AuthManagerStatus {
    return this._status;
  }

  /**
   * Invalidates the current token, if any.
   * This should be used if the token is known to be invalid, e.g., if a request using the token
   * returned a 401.
   */
  invalidateToken(): void {
    this._token = undefined;
    this._status = "need-token";
  }

  async checkToken(): Promise<Token | undefined> {
    let token: Token | undefined;
    try {
      // XXX check whether we can non-interactively getAuthToken in content-script
      if (env.canPromptAuth()) {
        token = await chrome.identity.getAuthToken({
          interactive: false,
        });
      } else {
        // eslint-disable-next-line unicorn/no-useless-undefined -- No choice.
        const resp = await channels.checkAuthToken.send(undefined);
        token = resp.token;
      }
    } catch (error) {
      // XXX check error
      log("error", "AuthManager.checkToken error", error);
      this._status = "need-token";
      this._token = undefined;
      return undefined;
    }
    this._token = token;
    this._status = "ready";
  }

  async promptToken(): Promise<Token> {
    let token: Token;
    if (env.canPromptAuth()) {
      token = await chrome.identity.getAuthToken({ interactive: true });
    } else {
      // eslint-disable-next-line unicorn/no-useless-undefined -- No choice.
      const resp = await channels.promptToken.send(undefined);
      token = resp.token;
    }
    this._token = token;
    this._status = "ready";
    return this._token;
  }
}

export const authManager = new AuthManager();
