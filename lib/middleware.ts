import type { RequestHandler } from "express";

export type Middleware = () => RequestHandler;

/**
 * Express middleware to be used to connect to Bonnier OIDC provider and register reguired routes.
 *
 * Only logs that occur inside the request context will be decorated, and applications running
 * in GCP will get the appropriate log fields to show up correctly in the GCP Trace Explorer.
 */
export const middleware: Middleware = () => {
  return (_req, _res, next) => {
    // do any required setup
    // register routes
    return next();
  };
};
