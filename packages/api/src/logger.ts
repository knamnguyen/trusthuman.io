import path from "node:path";
import pino from "pino";

export type Logger = pino.Logger;

export class LoggerService {
  private readonly base;

  constructor(loggerLevel: string) {
    this.base = pino(
      {
        level: loggerLevel,
      },
      pino.destination(
        process.env.NODE_ENV === "production"
          ? {
              target: "pino-roll",
              options: {
                file: path.join(process.cwd(), "data/logs/"),
                mkdir: true,
                symlink: true,
                dateFormat: "yyyy-MM-dd",
                frequency: "daily",
              },
            }
          : {
              target: "pino-pretty",
            },
      ),
    );
  }

  create(bindings: pino.Bindings) {
    return this.base.child(bindings);
  }
}
