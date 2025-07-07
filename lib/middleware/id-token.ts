import type { Request, Response, NextFunction } from "express";

import { decodeJwt } from "../utils/jwt";

async function idToken(req: Request, res: Response, next: NextFunction) {
  if (req.oidc.idToken) {
    const { wellKnownConfig, clientConfig, signingKeys } = req.oidc.config;

    const decodedJwt = decodeJwt(req.oidc.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });

    if (!decodedJwt) {
      // If the ID token is invalid, try to refresh it
      try {
        await req.oidc.refresh(req, res);
      } catch (refreshError) {
        // If the refresh fails, redirect to login
        // TODO: look at how we can hahndle possible loops here when id-service is down without loggin out users in the case that the id-service is down??
        req.oidc.login(req, res, { returnUri: req.originalUrl });

        return;
      }
    }

    req.oidc.idTokenClaims = decodedJwt;
    req.oidc.isAuthenticated = true;
  }

  next();
}

export { idToken };
