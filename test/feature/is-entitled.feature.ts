import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { generateIdToken } from "../helpers/id-token-helper";
import { isEntitled } from "../../lib/middleware/is-entitled";
import { UnauthorizedError } from "../../lib/errors";

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

  Scenario("Protected routes", () => {
    const requiredEntitlents = [ "ent1" ];
    const requiredEntitlents2 = [ "ent2" ];

    Given("we have a protected route", () => {
      app.get("/protected-article", isEntitled(requiredEntitlents), (_, res) => {
        return res.send(true);
      });
      app.get("/protected-article2", isEntitled(requiredEntitlents2), (_, res) => {
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
      const cookieValue = `j:${JSON.stringify({
        accessToken: "test-access-token",
        idToken,
        refreshToken: "test-refresh-token",
        expiresIn: 600,
      })}`;
      cookieString = `bnoidctokens=${encodeURIComponent(cookieValue)}`;

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
});
