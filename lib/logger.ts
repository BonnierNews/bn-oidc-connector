import config from "exp-config";
import { getId } from "exp-correlator";
import expLogger from "@bonniernews/exp-logger";

export const logger = expLogger({
  logLevel: config.logLevel,
  mixin: () => ({ correlationId: getId() }),
});
