import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { generateIdToken } from "../helpers/id-token-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Refresh", () => {
  const jwk = pem2jwk(readFileSync("test/helpers/public.pem", "utf8"));
  const jwks = { keys: [ jwk ] };
  const idToken = generateIdToken({ name: "John Doe" }, { algorithm: "RS256", expiresIn: "10m" });
  const cookieValue = `j:${JSON.stringify({
    accessToken: "test-access-token",
    idToken,
    refreshToken: "test-refresh-token",
    expiresIn: 600,
  })}`;
  const cookieString = `bnoidctokens=${encodeURIComponent(cookieValue)}`;

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

  Scenario("Refresh is initiated by a query parameter", () => {
    let refreshResponse: request.Response;

    Given("the OIDC provider can handle an OAuth token request", () => {
      nock(issuerBaseURL)
        .post("/oauth/token")
        .reply(200, {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "Bearer",
          expires_in: 600,
          id_token: idToken,
        });
    });

    When("client navigates to a URL with idrefresh query parameter", async () => {
      refreshResponse = await request(app)
        .get("/some-path?idrefresh=true&otherParam=value")
        .set("Cookie", cookieString);
    });

    Then("token cookie is set", () => {
      expect(refreshResponse.status).to.equal(404);
      expect(refreshResponse.header["set-cookie"]).to.exist;
    });
  });
});
