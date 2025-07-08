import type { Request } from "express";

function isUserEntitled(req: Request, validEntitlements: string[]): boolean {
  if (validEntitlements.length === 0) {
    return true;
  }
  const userEntitlements = req.oidc.idTokenClaims ?? [];

  return validEntitlements.some((entitlement) => userEntitlements.includes(entitlement));
}

export { isUserEntitled };
