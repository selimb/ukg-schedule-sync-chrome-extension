export async function waitFor<T>(
  fn: () => T | undefined,
  options: { initialDelayMs: number; intervalMs: number; maxWaitMs: number },
): Promise<T | undefined> {
  const { initialDelayMs, intervalMs, maxWaitMs } = options;
  return await new Promise((resolve, reject) => {
    let interval: NodeJS.Timeout | undefined;

    const timeout = setTimeout(() => {
      const result = fn();
      if (result !== undefined) {
        resolve(result);
        return;
      }

      interval = setInterval(() => {
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
    }, initialDelayMs);

    setTimeout(() => {
      clearTimeout(timeout);
      clearInterval(interval);
      resolve(undefined);
    }, maxWaitMs);
  });
}
