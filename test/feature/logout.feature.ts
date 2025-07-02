import request from "supertest";
import nock from "nock";

import { parseSetCookieHeader } from "../helpers/cookie-helper";
import { createAppWithMiddleware } from "../helpers/app-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Logout", () => {
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

  Scenario("User navigates to logout", () => {
    let logoutResponse: request.Response;
    let callbackResponse: request.Response;
    let cookies: string;
    let state: string;

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

    And("User is logged in", async () => {
      // Hack ensure user has loghed in by using refresh with setcookie in same request
      await request(app)
        .get("/some-path?idrefresh=true&otherParam=value")
        .set("Cookie", "bnoidctokens=j%3A%7B%22access_token%22%3A%22test-access-token%22%2C%22refresh_token%22%3A%22test-refresh-token%22%2C%22token_type%22%3A%22Bearer%22%2C%22expires_in%22%3A600%2C%22id_token%22%3A%22test-id-token%22%7D");
    });

    When("when user navigates to /id/logout", async () => {
      logoutResponse = await request(app).get("/id/logout?return-uri=%2Ftest")
        .set("Cookie", "bnoidctokens=j%3A%7B%22access_token%22%3A%22test-access-token%22%2C%22refresh_token%22%3A%22test-refresh-token%22%2C%22token_type%22%3A%22Bearer%22%2C%22expires_in%22%3A600%2C%22id_token%22%3A%22test-id-token%22%7D");
    });

    Then("user is redirected to the OIDC provider for logout", () => {
      expect(logoutResponse.status).to.equal(302);
      const locationUrl = new URL(logoutResponse.header.location);
      expect(locationUrl.origin).to.equal(issuerBaseURL);
      expect(locationUrl.pathname).to.equal("/oauth/logout");
      expect(locationUrl.searchParams.get("client_id")).to.equal(clientId);
      expect(locationUrl.searchParams.get("post_logout_redirect_uri")).to.equal(`${baseURL}/id/logout/callback?return-uri=%2Ftest`);
    });

    let parsedSetCookieHeader: Record<string, any>;

    And("logout cookie is set", () => {
      parsedSetCookieHeader = parseSetCookieHeader(logoutResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader.bnoidclogout).to.exist;
      expect(parsedSetCookieHeader.bnoidclogout).to.have.property("state");

      cookies = logoutResponse.header["set-cookie"];
      state = parsedSetCookieHeader.bnoidclogout.state;
    });

    And("the tokens cookie is unset", () => {
      expect(parsedSetCookieHeader).to.have.property("bnoidctokens");
      expect(parsedSetCookieHeader.bnoidctokens).to.be.a("null");
    });

    When("OIDC provider redirects back to the callback endpoint with incorrect state", async () => {
      callbackResponse = await request(app)
        .get("/id/logout/callback?return-uri=%2Ftest&state=incorrect-state")
        .set("Cookie", cookies);
    });

    Then("user is redirected to /", () => {
      expect(callbackResponse.status).to.equal(302);
      expect(callbackResponse.header.location).to.equal("/");
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader).to.have.property("bnoidclogout");
      expect(parsedSetCookieHeader.bnoidclogout).to.be.a("null");
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      callbackResponse = await request(app)
        .get(`/id/logout/callback?return-uri=%2Ftest&state=${state}`)
        .set("Cookie", cookies);
    });

    Then("logout token is removed and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      expect(callbackResponse.header.location).to.equal("/test");
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader).to.have.property("bnoidclogout");
      expect(parsedSetCookieHeader.bnoidclogout).to.be.a("null");
    });
  });
});
