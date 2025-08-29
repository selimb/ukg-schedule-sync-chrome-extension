import type { FC } from "preact/compat";

export const GoogleForm: FC = () => {
  return (
    <form>
      <button
        type="button"
        onClick={() => {
          void chrome.identity.getAuthToken({ interactive: true });
        }}
      >
        Check
      </button>
    </form>
  );
};
