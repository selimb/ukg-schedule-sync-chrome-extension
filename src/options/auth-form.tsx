import { type FC, useState } from "preact/compat";

type TokenState =
  | {
      state: "idle";
      data?: undefined;
      error?: undefined;
    }
  | {
      state: "loading";
      data?: undefined;
      error?: undefined;
    }
  | {
      state: "success";
      data: chrome.identity.GetAuthTokenResult;
      error?: undefined;
    }
  | {
      state: "error";
      data?: undefined;
      error: unknown;
    };

const TOKEN_STATE_DEFAULT: TokenState = { state: "idle" };

export const AuthForm: FC = () => {
  const [token, setToken] = useState<TokenState>(TOKEN_STATE_DEFAULT);

  const getNewToken = async (): Promise<void> => {
    setToken({ state: "loading" });
    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      setToken({ state: "success", data: token });
    } catch (error) {
      setToken({ state: "error", error });
    }
  };

  return (
    <form>
      <button
        type="button"
        disabled={token.state === "loading"}
        onClick={() => {
          void getNewToken();
        }}
      >
        Check
      </button>
      <pre>{JSON.stringify(token, undefined, 4)}</pre>
    </form>
  );
};
