export class AsyncMutex {
  private sem: Semaphore;

  constructor() {
    this.sem = new Semaphore(1);
  }

  get locked() {
    return this.sem.locked;
  }

  async lock() {
    return await this.sem.acquire();
  }

  unlock(): void {
    this.sem.release();
  }
}

export class Semaphore {
  private queue: (() => void)[] = [];
  private size = 0;
  constructor(private readonly concurrency = 1) {}

  async acquire() {
    // if unlocked, then just lock it immediately
    if (++this.size <= this.concurrency) {
      return {
        [Symbol.dispose]: () => {
          this.release();
        },
      };
    }

    // else return a promise and append it to the queue
    const resolver = Promise.withResolvers<void>();
    this.queue.push(resolver.resolve);
    await resolver.promise;
    return {
      [Symbol.dispose]: () => {
        this.release();
      },
    };
  }

  get locked() {
    return this.size >= this.concurrency;
  }

  release(): void {
    this.size--;

    if (this.queue.length > 0) {
      this.queue.shift()?.();
    }
  }
}
