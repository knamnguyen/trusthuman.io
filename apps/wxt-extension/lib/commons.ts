export const defer = (cb: () => void) => {
  return {
    [Symbol.dispose]: () => {
      cb();
    },
  };
};

export const asyncDefer = (cb: () => Promise<void>) => {
  return {
    [Symbol.asyncDispose]: async () => {
      await cb();
    },
  };
};
