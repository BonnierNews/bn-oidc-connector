import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { generateIdToken } from "../helpers/id-token-helper";
import { isAuthenticated } from "../../lib/middleware/is-authenticated";
import { UnauthenticatedError } from "../../lib/errors";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("is-authenticated middleware", () => {
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

  Scenario("protecting article", () => {
    Given("we have a protected route", () => {
      app.get("/protected-article", isAuthenticated, (_, res) => {
        return res.send(true);
      });
    });

    And("We handle Unauthorized Errors", () => {
      app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err instanceof UnauthenticatedError) {
          return res.sendStatus(401);
        }
        return next(err);
      });
    });

    let protectedResult : request.Response;
    When("requesting a protected route without being logged in", async () => {
      protectedResult = await request(app).get("/protected-article");
    });

    Then("we could not get the article", () => {
      expect(protectedResult.status).to.eql(401);
    });

    When("requesting a protected article as a logged in user", async () => {
      const cookieString = Object.entries({
        bnoidcat: "test-access-token",
        bnoidcrt: "test-refresh-token",
        bnoidcit: idToken,
        bnoidcei: 600,
      }).map(([ key, value ]) => `${key}=${value}`).join("; ");

      protectedResult = await request(app).get("/protected-article").set("Cookie", cookieString);
    });

    Then("we could reach the article", () => {
      expect(protectedResult.status).to.eql(200);
    });
  });
});
