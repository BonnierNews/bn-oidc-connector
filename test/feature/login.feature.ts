import request from "supertest";
import nock from "nock";

import { parseSetCookieHeader } from "../helpers/cookie-helper";
import { createAppWithMiddleware } from "../helpers/app-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Login", () => {
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

  Scenario("Login is initiated by user clicking login button", () => {
    let loginResponse: request.Response;
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

    When("user requests the login endpoint", async () => {
      loginResponse = await request(app).get("/id/login?return-uri=%2Ftest");
      cookies = loginResponse.header["set-cookie"];
    });

    Then("user is redirected to the OIDC provider for authentication", () => {
      expect(loginResponse.status).to.equal(302);
      const redirectUri = new URL(loginResponse.header.location);
      expect(redirectUri.toString()).to.include(`${issuerBaseURL}/oauth/authorize`);
      const queryParams = Object.fromEntries(redirectUri.searchParams.entries());
      expect(queryParams.client_id).to.equal("test-client-id");
      expect(queryParams.response_type).to.equal("code");
      expect(queryParams.scope).to.equal("openid profile email entitlements offline_access");
      expect(queryParams.redirect_uri).to.equal(`${baseURL}/id/callback?return-uri=%2Ftest`);
      expect(queryParams.state).to.exist;
      expect(queryParams.nonce).to.exist;

      state = queryParams.state;
    });

    When("OIDC provider redirects back to the callback endpoint with incorrect state", async () => {
      callbackResponse = await request(app)
        .get("/id/callback?code=test-auth-code&state=incorrect-state")
        .set("Cookie", cookies);
    });

    Then("callback returns an error response", () => {
      expect(callbackResponse.status).to.equal(400);
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      callbackResponse = await request(app)
        .get(`/id/callback?code=test-auth-code&state=${state}`)
        .set("Cookie", cookies);
    });

    Then("token cookie is set and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      const parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader.bnoidctokens).to.exist;
      expect(parsedSetCookieHeader.bnoidctokens).to.include({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        id_token: "test-id-token",
      });
    });
  });

  Scenario("Login is initiated by query parameter", () => {
    let loginResponse: request.Response;
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

    When("client navigates to a URL with autologin query parameter", async () => {
      loginResponse = await request(app).get("/some-path?idlogin=true&otherParam=value");
      cookies = loginResponse.header["set-cookie"];
    });

    Then("user is redirected to the OIDC provider for authentication", () => {
      expect(loginResponse.status).to.equal(302);
      const redirectUri = new URL(loginResponse.header.location);
      expect(redirectUri.toString()).to.include(`${issuerBaseURL}/oauth/authorize`);
      const queryParams = Object.fromEntries(redirectUri.searchParams.entries());
      expect(queryParams.client_id).to.equal("test-client-id");
      expect(queryParams.response_type).to.equal("code");
      expect(queryParams.scope).to.equal("openid profile email entitlements offline_access");
      expect(queryParams.redirect_uri).to.equal(`${baseURL}/id/callback?return-uri=%2Fsome-path%3FotherParam%3Dvalue`);
      expect(queryParams.state).to.exist;
      expect(queryParams.nonce).to.exist;

      state = queryParams.state;
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      callbackResponse = await request(app)
        .get(`/id/callback?code=test-auth-code&state=${state}`)
        .set("Cookie", cookies);
    });

    Then("token cookie is set and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      expect(callbackResponse.header["set-cookie"]).to.exist;
    });
  });
});
