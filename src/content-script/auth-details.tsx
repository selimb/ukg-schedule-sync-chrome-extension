import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { Icon } from "../shared/icons";
import type { UseAuthResult } from "../shared/use-auth";

export const AuthenticationDetails: React.FC<UseAuthResult> = ({
  qCheckAuth,
  promptAuth,
}) => {
  let icon: string;
  let body: React.ReactNode;

  switch (qCheckAuth.status) {
    case "pending": {
      icon = Icon.loading;
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = Icon.error;
      body = <ErrorDetails error={qCheckAuth.error} />;
      break;
    }
    case "success": {
      const auth = qCheckAuth.data;
      if (auth) {
        icon = Icon.ok;
        body = <p className="font-mono">{auth.profile.email}</p>;
      } else {
        icon = Icon.warning;
        body = (
          <Button
            disabled={promptAuth.isPending}
            onClick={() => {
              promptAuth.mutate();
            }}
            type="button"
          >
            Login
          </Button>
        );
      }
      break;
    }
  }

  return (
    <div>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Authentication</span>

        <span>{icon}</span>
      </h2>

      {body}

      {promptAuth.error ? (
        <>
          <h3>Failed to Login</h3>

          <ErrorDetails error={promptAuth.error} />
        </>
      ) : undefined}
    </div>
  );
};
