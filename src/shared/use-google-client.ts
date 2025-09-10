import { useMemo } from "react";

import { GoogleClient } from "../lib/google";
import { useAuth } from "./use-auth";

// TODO: Use a context or syncExternalStore?
export function useGoogleClient(): GoogleClient | undefined {
  const { qCheckAuth } = useAuth();

  const token = qCheckAuth.data?.token.token;
  return useMemo(() => (token ? new GoogleClient(token) : undefined), [token]);
}
