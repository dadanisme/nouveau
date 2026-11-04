/**
 * Rejects with `new Error(message)` when `promise` hasn't settled after `ms`. The work itself
 * isn't cancelled; this only stops a caller (and its spinner) from waiting forever.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
