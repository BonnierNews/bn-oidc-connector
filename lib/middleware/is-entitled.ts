import type { Request, Response, NextFunction } from "express";

import { UnauthorizedError, UnauthenticatedError } from "../errors";
import { isUserEntitled } from "../utils/claims";

function isEntitled(validEntitlements: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Check if user is authenticated first
    if (!req.oidc.isAuthenticated) {
      next(new UnauthenticatedError("User is not logged in"));

      return;
    }

    if (isUserEntitled(req, validEntitlements)) {
      next();

      return;
    }

    next(new UnauthorizedError(`User lacks required entitlements: ${validEntitlements.join(", ")}`));
  };
}

export { isEntitled };
