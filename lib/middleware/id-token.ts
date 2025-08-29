import type { Request, Response, NextFunction } from "express";

import type { OidcRequestContext } from "../types";
import { decodeJwt } from "../utils/jwt";

async function idToken(req: Request, res: Response, next: NextFunction) {
  if (!req.oidc.idToken) {
    next();

    return;
  }

  const { wellKnownConfig, clientConfig, signingKeys } = req.oidc.config;
  const { issuer } = wellKnownConfig;
  const { clientId: audience } = clientConfig;

  let decodedJwt = decodeJwt(req.oidc.idToken, signingKeys, { issuer, audience });

  if (!decodedJwt) {
    try {
      await res.oidc.refresh(req, res);

      // Decode the new ID token again after refresh
      decodedJwt = decodeJwt(req.oidc.idToken, signingKeys, { issuer, audience });

      if (!decodedJwt) {
        throw new Error("Failed to decode ID token after refresh");
      }
    } catch (error) {
      res.oidc.login(req, res, { returnTo: req.originalUrl });

      return;
    }
  }

  req.oidc.idTokenClaims = decodedJwt;
  req.oidc.isAuthenticated = true;

  attachUserToContext(req, decodedJwt);

  next();
}

function attachUserToContext(req: Request, decodedJwt: Record<string, any>) {
  const user: OidcRequestContext["user"] = {
    id: decodedJwt.sub,
    ...(decodedJwt.email && { email: decodedJwt.email }),
  };

  req.oidc.user = user;
}

export { idToken };
