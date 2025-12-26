export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
}

export function* chunkify<T>(array: T[], chunkSize: number) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function merge<T extends Record<string, any>>(...objs: T[]): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as Record<string, any>;

  for (const obj of objs) {
    for (const [key, val] of Object.entries(obj)) {
      result[key] ??= val;
    }
  }

  return result as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformValuesIfMatch<T extends Record<string, any>, M, V>(
  obj: T,
  transformer: {
    from: M;
    to: V;
  },
): { [K in keyof T]: T[K] extends M | T[K] ? V | Exclude<T[K], M> : T[K] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as Record<keyof T, any>;

  for (const [key, val] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
    if (val === transformer.from) {
      result[key] = transformer.to;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      result[key] = val as any;
    }
  }

  return result as {
    [K in keyof T]: T[K] extends M | T[K] ? V | Exclude<T[K], M> : T[K];
  };
}

type Result<T, E = unknown> =
  | {
      ok: true;
      output: T;
    }
  | {
      ok: false;
      error: E;
    };

type SafeResult<T> =
  T extends Promise<infer U> ? Promise<Result<U>> : Result<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(value: any): value is Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return typeof value?.then === "function";
}

export function safe<T>(fn: () => T): SafeResult<T> {
  try {
    const output = fn();
    if (isPromise(output)) {
      return output
        .then((res: T) => ({
          ok: true as const,
          output: res,
        }))
        .catch((error: unknown) => ({
          ok: false as const,
          error,
        })) as SafeResult<T>;
    }

    return {
      ok: true,
      output,
    } as SafeResult<T>;
  } catch (error) {
    return {
      ok: false,
      error,
    } as SafeResult<T>;
  }
}

export async function retry<TOutput>(
  fn: () => TOutput,
  opts?: {
    timeout?: number;
    interval?: number;
    retryOn?: (output: TOutput) => boolean;
  },
) {
  const { timeout = 10000, interval = 200 } = opts ?? {};
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await Promise.resolve(fn());

      return {
        ok: true,
        data: result,
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
      // ignore
    }
  }

  return {
    ok: false,
    error: new Error("timeout"),
  };
}

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<"woke" | "aborted">((resolve) => {
    const timeoutId = setTimeout(() => resolve("woke"), ms);
    if (signal === undefined) return;

    const abortHandler = () => {
      resolve("aborted");
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", abortHandler);
    };

    if (signal.aborted) {
      abortHandler();
      return;
    }

    signal.addEventListener("abort", abortHandler);
  });
}
