import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { parseSetCookieHeader } from "../helpers/cookie-helper";
import { generateIdToken } from "../helpers/id-token-helper";

const clientId = "test-client-id";
const clientSecret = "test-client-secret";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Login", () => {
  const jwk = pem2jwk(readFileSync("test/helpers/public.pem", "utf8"));
  const jwks = { keys: [ jwk ] };
  const idToken = generateIdToken({ name: "John Doe" }, { algorithm: "RS256" });

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
    clientSecret,
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
        .reply(200, {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "Bearer",
          expires_in: 600,
          id_token: idToken,
        });
    });

    When("user requests the login endpoint", async () => {
      loginResponse = await request(app).get("/id/login?return-path=%2Ftest");
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
      expect(queryParams.redirect_uri).to.equal(`${baseURL}/id/login/callback?return-path=%2Ftest`);
      expect(queryParams.state).to.exist;
      expect(queryParams.nonce).to.exist;

      state = queryParams.state;
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      callbackResponse = await request(app)
        .get(`/id/login/callback?code=test-auth-code&state=${state}`)
        .set("Cookie", cookies);
    });

    let parsedSetCookieHeader: Record<string, any>;

    Then("token cookie is set and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader.bnoidctokens).to.exist;
      expect(parsedSetCookieHeader.bnoidctokens).to.include({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        idToken,
      });
    });

    And("authParams cookie is removed", () => {
      expect(parsedSetCookieHeader).to.have.property("bnoidcauthparams");
      expect(parsedSetCookieHeader.bnoidcauthparams).to.be.a("null");
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
          id_token: idToken,
        });
    });

    When("client navigates to a URL with idlogin query parameter", async () => {
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
      expect(queryParams.redirect_uri).to.equal(`${baseURL}/id/login/callback?return-path=%2Fsome-path%3FotherParam%3Dvalue`);
      expect(queryParams.state).to.exist;
      expect(queryParams.nonce).to.exist;

      state = queryParams.state;
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      callbackResponse = await request(app)
        .get(`/id/login/callback?code=test-auth-code&state=${state}`)
        .set("Cookie", cookies);
    });

    let parsedSetCookieHeader: Record<string, any>;

    Then("token cookie is set and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader.bnoidctokens).to.exist;
      expect(parsedSetCookieHeader.bnoidctokens).to.include({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        idToken,
      });
    });

    And("authParams cookie is removed", () => {
      expect(parsedSetCookieHeader).to.have.property("bnoidcauthparams");
      expect(parsedSetCookieHeader.bnoidcauthparams).to.be.a("null");
    });
  });
});
