// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary.
export function asyncDedup<F extends (...args: any[]) => Promise<any>>(
  fn: F,
): F {
  let inFlight: Promise<unknown> | undefined;

  const wrapper = async function (...args: unknown[]): Promise<unknown> {
    if (inFlight) {
      return await inFlight;
    }

    inFlight = fn(...args);
    try {
      const result = await inFlight;
      return result;
    } finally {
      inFlight = undefined;
    }
  };

  return wrapper as F;
}
