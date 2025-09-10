import type { FC } from "react";

import { Button } from "../shared/button";
import { ErrorDetails } from "../shared/error-details";
import { useAuth } from "../shared/use-auth";

export const AuthForm: FC = () => {
  const { qCheckAuth, promptAuth } = useAuth();
  let icon: string;
  let body: React.ReactNode;

  switch (qCheckAuth.status) {
    case "pending": {
      icon = "⏳";
      body = <p>Loading...</p>;
      break;
    }
    case "error": {
      icon = "❌";
      body = (
        <>
          <p>ERROR</p>

          <ErrorDetails error={qCheckAuth.error} />
        </>
      );
      break;
    }
    case "success": {
      const auth = qCheckAuth.data;
      if (auth) {
        icon = "✅";
        body = <p className="font-mono">{auth.profile.email}</p>;
      } else {
        icon = "⚠️";
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
    }
  }
  return (
    <section>
      <h2 className="flex items-center gap-2">
        <span className="text-lg">Authentication</span>

        {icon ? <span>{icon}</span> : undefined}
      </h2>

      {body}
    </section>
  );
};
