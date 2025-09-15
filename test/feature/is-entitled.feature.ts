import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { generateIdToken } from "../helpers/id-token-helper";
import { isEntitled } from "../../lib/middleware/is-entitled";
import { UnauthorizedError, UnauthenticatedError } from "../../lib/errors";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("is-entitled middleware", () => {
  const jwk = pem2jwk(readFileSync("test/helpers/public.pem", "utf8"));
  const jwks = { keys: [ jwk ] };
  const idToken = generateIdToken({ name: "John Doe", ent: [ "ent1" ] }, { algorithm: "RS256" });

  nock(issuerBaseURL)
    .get("/oauth/.well-known/openid-configuration")
    .reply(200, {
      issuer: issuerBaseURL,
      authorization_endpoint: `${issuerBaseURL}/oauth/authorize`,
      token_endpoint: `${issuerBaseURL}/oauth/token`,
      userinfo_endpoint: `${issuerBaseURL}/oauth/userinfo`,
      jwks_uri: `${issuerBaseURL}/oauth/jwks`,
      end_session_endpoint: `${issuerBaseURL}/oauth/logout`,
      scopes_supported: [ "openid", "profile", "email", "entitlements", "externalIds", "offline_access" ],
      response_types_supported: [ "code" ],
      grant_types_supported: [ "authorization_code", "refresh_token" ],
      subject_types_supported: [ "public" ],
      id_token_signing_alg_values_supported: [ "HS256", "RS256" ],
      ui_locales_supported: [ "da-DK", "en-US", "fi-FI", "nl-NL", "nb-NO", "sv-SE" ],
    });

  nock(issuerBaseURL)
    .get("/oauth/jwks")
    .reply(200, jwks);

  const app = createAppWithMiddleware({
    clientId,
    issuerBaseURL: new URL(issuerBaseURL),
    baseURL: new URL(baseURL),
    scopes: [ "profile", "email", "entitlements", "offline_access" ],
  });

  Scenario("Authenticated users with entitlements", () => {
    const requiredEntitlements = [ "ent1" ];
    const requiredEntitlements2 = [ "ent2" ];

    Given("we have a protected route", () => {
      app.get("/protected-article", isEntitled(requiredEntitlements), (_, res) => {
        return res.send(true);
      });
      app.get("/protected-article2", isEntitled(requiredEntitlements2), (_, res) => {
        return res.send(true);
      });
    });

    And("We handle Unauthorized Errors", () => {
      app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err instanceof UnauthorizedError) {
          return res.sendStatus(401);
        }
        return next(err);
      });
    });

    let cookieString : string;
    And("user is logged in", () => {
      cookieString = Object.entries({
        bnoidcat: "test-access-token",
        bnoidcrt: "test-refresh-token",
        bnoidcit: idToken,
        bnoidcei: 600,
      }).map(([ key, value ]) => `${key}=${value}`).join("; ");
    });

    let protectedResult : request.Response;
    When("requesting a protected route with the correct entitlements", async () => {
      protectedResult = await request(app).get("/protected-article").set("Cookie", cookieString);
    });

    Then("we could reach the article with required entitlements", () => {
      expect(protectedResult.status).to.eql(200);
      expect(protectedResult.body).to.eql(true);
    });

    When("requesting a protected route WITHOUT the correct entitlements", async () => {
      protectedResult = await request(app).get("/protected-article2").set("Cookie", cookieString);
    });

    Then("we could NOT reach the article with required entitlements", () => {
      expect(protectedResult.status).to.eql(401);
    });
  });

  Scenario("Unauthenticated users are rejected", () => {
    Given("we have a protected admin route using isEntitled", () => {
      app.get("/admin", isEntitled([ "admin" ]), (_, res) => {
        return res.json({ message: "Admin area" });
      });
    });

    And("we handle authentication and authorization errors", () => {
      app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err instanceof UnauthenticatedError) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        if (err instanceof UnauthorizedError) {
          return res.status(403).json({ error: "Not authorized" });
        }
        return next(err);
      });
    });

    let result: request.Response;
    When("an unauthenticated user tries to access the admin route", async () => {
      result = await request(app).get("/admin");
    });

    Then("they receive a 401 Unauthenticated error", () => {
      expect(result.status).to.eql(401);
      expect(result.body.error).to.eql("Not authenticated");
    });
  });
});
