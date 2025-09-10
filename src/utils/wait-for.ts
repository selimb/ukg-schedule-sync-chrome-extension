export async function waitFor<T>(
  fn: () => T | undefined,
  options: { intervalMs: number; abort: AbortSignal },
): Promise<T | undefined> {
  const { abort, intervalMs } = options;
  return await new Promise((resolve, reject) => {
    const result = fn();
    if (result !== undefined) {
      resolve(result);
      return;
    }

    const interval = setInterval(() => {
      if (abort.aborted) {
        clearInterval(interval);
        resolve(undefined);
        return;
      }

      try {
        const result = fn();
        if (result !== undefined) {
          clearInterval(interval);
          resolve(result);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error as Error);
      }
    }, intervalMs);

    abort.addEventListener("abort", () => {
      clearInterval(interval);
      resolve(undefined);
    });
  });
}
