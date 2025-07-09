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
      try {
        await res.oidc.refresh(req, res);
      } catch (RefreshRequestError) {
        res.oidc.login(req, res, { returnPath: req.originalUrl });

        return;
      }
    }

    req.oidc.idTokenClaims = decodedJwt;
    req.oidc.isAuthenticated = true;
  }

  next();
}

export { idToken };
