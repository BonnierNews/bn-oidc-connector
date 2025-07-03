import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { verifyJwt } from "../utils/jwt";

async function tokenValidation(req: Request, res: Response, next: NextFunction) {
  if (!req.oidc || !req.oidc.context) {
    next(new Error("OIDC context is not initialized"));

    return;
  }

  const { wellKnownConfig, clientConfig, signingKeys } = req.oidc.context;

  if (req.oidc.idToken) {
    try {
      req.oidc.idTokenClaims = verifyJwt(req.oidc.idToken, signingKeys, {
        issuer: wellKnownConfig.issuer,
        audience: clientConfig.clientId,
      });
      req.oidc.isAuthenticated = true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        await req.oidc.refresh(req, res);
      } else {
        // TODO: Handle other errors
        res.status(401).send("Invalid ID token");

        return;
      }
    }
  }

  next();
}

export { tokenValidation };
