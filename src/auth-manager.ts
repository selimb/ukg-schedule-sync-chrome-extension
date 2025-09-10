import { channels } from "./channels";
import { env } from "./env";
import { asyncDedup } from "./utils/async-dedup";

/** Authentication token and profile details. */
export type AuthInfo = {
  token: chrome.identity.GetAuthTokenResult;
  profile: chrome.identity.ProfileUserInfo;
};

async function checkCachedToken(): Promise<
  chrome.identity.GetAuthTokenResult | undefined
> {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: false });
    return token;
  } catch (error) {
    // XXX check error
    return undefined;
  }
}

/**
 * Manages the chrome identity token.
 */
export class AuthManager {
  /** This token is guaranteed to be valid. */
  private _authInfo: AuthInfo | undefined;

  constructor() {
    this.checkAuth = asyncDedup(this.checkAuth.bind(this));
    this.promptAuth = asyncDedup(this.promptAuth.bind(this));
  }

  get auth(): AuthInfo | undefined {
    return this._authInfo;
  }

  /**
   * Invalidates the current token, if any.
   * This should be used if the token is known to be invalid, e.g., if a request using the token
   * returned a 401.
   */
  invalidateAuth(): void {
    this._authInfo = undefined;
  }

  async checkAuth(): Promise<AuthInfo | undefined> {
    let auth: AuthInfo | undefined;
    if (env.canUseIdentity()) {
      const token = await checkCachedToken();
      if (token) {
        const profile = await chrome.identity.getProfileUserInfo();
        auth = { token, profile };
      }
    } else {
      const resp = await channels.checkAuth.send(undefined);
      auth = resp.auth;
    }
    this._authInfo = auth;
    return this._authInfo;
  }

  async promptAuth(): Promise<AuthInfo> {
    let auth: AuthInfo;
    if (env.canUseIdentity()) {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      const profile = await chrome.identity.getProfileUserInfo();
      auth = { token, profile };
    } else {
      const resp = await channels.promptAuth.send(undefined);
      auth = resp.auth;
    }
    this._authInfo = auth;
    return this._authInfo;
  }
}

export const authManager = new AuthManager();
