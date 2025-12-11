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
      status: "success";
      output: T;
    }
  | {
      status: "error";
      error: E;
    };

type SafeResult<T> =
  T extends Promise<infer U> ? Promise<Result<U>> : Result<T>;

export function safe<T>(fn: () => T): SafeResult<T> {
  try {
    const output = fn();
    if (output instanceof Promise) {
      return output
        .then((res: T) => ({
          status: "success" as const,
          output: res,
        }))
        .catch((error: unknown) => ({
          status: "error" as const,
          error,
        })) as SafeResult<T>;
    }

    return {
      status: "success",
      output,
    } as SafeResult<T>;
  } catch (error) {
    return {
      status: "error",
      error,
    } as SafeResult<T>;
  }
}
