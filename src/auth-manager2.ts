import { authStore } from "./storage/auth";
import { asyncDedup } from "./utils/async-dedup";

type Token = chrome.identity.GetAuthTokenResult;

const getNewToken = asyncDedup(async function getNewToken(): Promise<Token> {
  // XXX message?
  const token = await chrome.identity.getAuthToken({ interactive: true });
  await authStore.set(token);
  return token;
});

const checkToken = asyncDedup(async function checkToken(): Promise<
  Token | undefined
> {
  const token = await authStore.get();
  if (!token) {
    return undefined;
  }

  try {
    var tokenNew = await chrome.identity.getAuthToken({ interactive: false });
  } catch (error) {
    await authStore.reset();
    // XXX
    return undefined;
  }
  await authStore.set(tokenNew);
  return tokenNew;
});

type AuthManagerOptions = {
  /**
   * If false, then we can't call `chrome.identity.getAuthToken` directly from this
   * environment and must go through a message to the service worker instead.
   */
  canPrompt: boolean;
};
type AuthManagerStatus = "init" | "checking-token" | "need-token" | "ready";

/**
 * Manages the chrome identity token.
 */
export class AuthManager {
  public readonly options: AuthManagerOptions;

  /** This token is guaranteed to be valid. */
  private token: Token | undefined;

  constructor(options: AuthManagerOptions) {
    this.options = options;
    this.checkToken = asyncDedup(this.checkToken.bind(this));
    authStore.listen((token) => {
      this.token = token;
    });
  }

  /**
   * Invalidates the current token, if any.
   * This should be used if the token is known to be invalid, e.g., if a request using the token
   * returned a 401.
   */
  async invalidateToken(): Promise<void> {
    await authStore.reset();
    this.token = undefined;
  }

  private async setToken(token: Token): Promise<void> {
    await authStore.set(token);
    this.token = token;
  }

  /**
   * Checks whether the stored token is "valid".
   * If it is, it is stored in `this.token` and returned.
   */
  async checkToken(): Promise<Token | undefined> {
    const maybeToken = await authStore.get();
    if (!maybeToken) {
      return undefined;
    }

    await chrome.identity;
  }
}

export const authManager = new AuthManager();
