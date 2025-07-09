import { describe, it } from "node:test";
import { type Request } from "express";

import type { OidcRequestContext } from "../../lib/types";
import { isUserEntitled } from "../../lib/utils/claims";

describe("Claims", () => {
  const req = {} as Request;
  req.oidc = {} as OidcRequestContext;
  req.oidc.idTokenClaims = { ent: [ "entitlement1" ] };

  it("user has required entitlements", () => {
    const requiredEntitlents = [ "entitlement1" ];
    const isEntitled = isUserEntitled(req, requiredEntitlents);
    expect(isEntitled).to.eql(true);
  });

  it("user DONT have required entitlements", () => {
    const requiredEntitlents = [ "entitlement2" ];
    const isEntitled = isUserEntitled(req, requiredEntitlents);
    expect(isEntitled).to.eql(false);
  });
});
