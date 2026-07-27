import type { Request } from "express";

import type { OidcRequestContext } from "../types";

function isUserEntitled(req: Request, validEntitlements: string[]): boolean {
  if (validEntitlements.length === 0) {
    return true;
  }
  const userEntitlements = req.oidc.idTokenClaims?.ent ?? [];

  return validEntitlements.some((entitlement) => userEntitlements.includes(entitlement));
}

function attachUserToContext(req: Request, decodedJwt: Record<string, any>) {
  const user: OidcRequestContext["user"] = {
    id: decodedJwt.sub,
    ...(decodedJwt.email && { email: decodedJwt.email }),
  };

  req.oidc.user = user;
}

export { attachUserToContext, isUserEntitled };
