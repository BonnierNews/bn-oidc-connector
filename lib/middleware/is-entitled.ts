import type { Request, Response, NextFunction } from "express";

import { UnauthorizedError } from "../errors";
import { isUserEntitled } from "../utils/claims";

function isEntitled(validEntitlements: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {

    if (isUserEntitled(req, validEntitlements)) {
      return next();
    }

    next(new UnauthorizedError(`User is not entitled to following entitlements: ${validEntitlements}`));
  };
}

export { isEntitled };
