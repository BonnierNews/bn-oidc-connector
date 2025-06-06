import { Router } from "express";
import request from "supertest";
import nock from "nock";

import { createApp } from "../helpers/app-helper";
import { middleware as createMiddleware } from "../../lib/middleware";

const issuerBaseURL = "https://oidc.test";

Feature("visiting the application", () => {

  Scenario("Visiting /", () => {
    let app: any;
    Given("id-service returns oidc-config", () => {
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
    });

    And("the application is configured with a client ID and issuer base URL", async () => {
      app = createApp();
      const middleware: Router = await createMiddleware({ clientId: "test-client-id", issuerBaseURL });
      app.use(middleware);
    });

    When("Middleware will execute callback", async () => {
      const res = await request(app).post("/callback");

      expect(res.status).to.equal(200);
    });
  });
});
