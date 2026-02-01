export const defer = (cb: () => void) => {
  return {
    [Symbol.dispose]: () => {
      cb();
    },
  };
};

export const deferAsync = (cb: () => Promise<void>) => {
  return {
    [Symbol.asyncDispose]: async () => {
      await cb();
    },
  };
};
