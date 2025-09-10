import { describe, it } from "node:test";
import { type Request } from "express";

import type { OidcRequestContext } from "../../lib/types";
import { isUserEntitled } from "../../lib/utils/claims";

describe("Claims", () => {
  const req = {} as Request;
  req.oidc = {} as OidcRequestContext;
  req.oidc.idTokenClaims = { ent: [ "entitlement1" ] };

  it("User has required entitlements", () => {
    const requiredEntitlements = [ "entitlement1" ];
    const isEntitled = isUserEntitled(req, requiredEntitlements);
    expect(isEntitled).to.eql(true);
  });

  it("User DOES NOT have required entitlements", () => {
    const requiredEntitlements = [ "entitlement2" ];
    const isEntitled = isUserEntitled(req, requiredEntitlements);
    expect(isEntitled).to.eql(false);
  });
});
