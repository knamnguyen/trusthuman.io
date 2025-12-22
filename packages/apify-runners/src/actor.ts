/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApifyClient } from "apify-client";
import type { z } from "zod";

export class ApifyActor<
  TInput extends z.ZodObject<any>,
  TOutput extends z.ZodObject<any>,
> {
  constructor(
    private readonly client: ApifyClient,
    private readonly opts: {
      input: TInput;
      output: TOutput;
      actorId: string;
    },
  ) {}

  async run(input: z.output<TInput>) {
    const res = await this.client.actor(this.opts.actorId).call(input);
    return res;
  }

  async getResults(datasetId: string) {
    const result = await this.client.dataset(datasetId).listItems();
    const parsed = this.opts.output.array().safeParse(result.items);
    return {
      ...result,
      items: result.items,
      parsed,
    };
  }
}
