import { getId } from "exp-correlator";
import { NextFunction, Request, Response } from "express";

import { logger } from "../logger";

export function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  if (!err) return next();
  logger.error(err, "errorHandler");

  res.status(500).send({
    error: err.message,
    correlationId: getId(),
  });
}
