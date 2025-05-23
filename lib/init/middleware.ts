import { middleware as correlatorMiddleware } from "exp-correlator";
import { Express } from "express";

export function middleware(app: Express) {
  // attach correlation id first
  app.use(correlatorMiddleware);
}
