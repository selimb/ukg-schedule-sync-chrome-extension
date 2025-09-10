import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type AuthInfo, authManager } from "../auth-manager";

export type UseAuthResult = ReturnType<typeof useAuth>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Type inference is easier.
export function useAuth() {
  const queryClient = useQueryClient();
  const checkAuthKey = ["check-auth"] as const;
  type CheckAuthData = AuthInfo | null;

  const qCheckAuth = useQuery({
    queryKey: checkAuthKey,
    queryFn: async (): Promise<CheckAuthData> => {
      const auth = await authManager.checkAuth();
      // eslint-disable-next-line unicorn/no-null -- Need null to workaround no-void-query-fn
      return auth ?? null;
    },
  });

  const promptAuth = useMutation({
    mutationFn: async () => {
      return await authManager.promptAuth();
    },
    onSuccess: (auth) => {
      queryClient.setQueryData(checkAuthKey, auth satisfies CheckAuthData);
    },
  });

  return { qCheckAuth, promptAuth };
}
