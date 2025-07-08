import type { Request, Response, NextFunction } from "express";

import { isUserEntitled } from "../utils/claims";

function isEntitled(validEntitlements: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {

    if (isUserEntitled(req, validEntitlements)) {
      return next();
    }

    next(new Error(`User is not entitled to following entitlements: ${validEntitlements}`));
  };
}

export { isEntitled };
