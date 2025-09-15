import type { Request, Response, NextFunction } from "express";

import { UnauthenticatedError } from "../errors";

function isAuthenticated(req: Request, _res: Response, next: NextFunction) {
  if (req.oidc.isAuthenticated) {
    next();

    return;
  }

  next(new UnauthenticatedError("User is not logged in"));
}

export { isAuthenticated };
