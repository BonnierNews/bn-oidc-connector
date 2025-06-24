import request from "supertest";
import nock from "nock";

import { createAppWithMiddleware } from "../helpers/app-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Refresh", () => {
  nock(issuerBaseURL)
    .get("/oauth/.well-known/openid-configuration")
    .times(1)
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

  const app = createAppWithMiddleware({
    clientId,
    issuerBaseURL: new URL(issuerBaseURL),
    baseURL: new URL(baseURL),
    scopes: [ "profile", "email", "entitlements", "offline_access" ],
  });

  app.route("/some-path").get((_, res) => {
    res.send({ hehe: "haha" });
  });

  Scenario("Refresh is initiated by a query parameter", () => {
    let refreshResponse: request.Response;

    Given("the OIDC provider can handle an OAuth token request", () => {
      nock(issuerBaseURL)
        .post("/oauth/token")
        .times(1)
        .reply(200, {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "Bearer",
          expires_in: 600,
          id_token: "test-id-token",
        });
    });

    When("client navigates to a URL with idrefresh query parameter", async () => {
      refreshResponse = await request(app)
        .get("/some-path?idrefresh=true&otherParam=value")
        .set("Cookie", "bnoidctokens=j%3A%7B%22access_token%22%3A%22test-access-token%22%2C%22refresh_token%22%3A%22test-refresh-token%22%2C%22token_type%22%3A%22Bearer%22%2C%22expires_in%22%3A600%2C%22id_token%22%3A%22test-id-token%22%7D");
    });

    Then("token cookie is set", () => {
      expect(refreshResponse.header["set-cookie"]).to.exist;
    });
  });
});
