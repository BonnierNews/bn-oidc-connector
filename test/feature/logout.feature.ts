import { readFileSync } from "fs";
import nock from "nock";
import { pem2jwk } from "pem-jwk";
import request from "supertest";

import { createAppWithMiddleware } from "../helpers/app-helper";
import { parseSetCookieHeader } from "../helpers/cookie-helper";
import { generateIdToken } from "../helpers/id-token-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Logout", () => {
  const jwk = pem2jwk(readFileSync("test/helpers/public.pem", "utf8"));
  const jwks = { keys: [ jwk ] };

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

  nock(issuerBaseURL)
    .get("/oauth/jwks")
    .reply(200, jwks);

  let customCallbackCalled = false;

  const app = createAppWithMiddleware({
    clientId,
    issuerBaseURL: new URL(issuerBaseURL),
    baseURL: new URL(baseURL),
    scopes: [ "profile", "email", "entitlements", "offline_access" ],
    customPostLogoutCallback(req, res) {
      if (req.query.post_logout_callback) {
        res.redirect("/some-custom-redirect-path");
        customCallbackCalled = true;
      }
      return;
    },
  });

  Scenario("User navigates to logout", () => {
    let logoutResponse: request.Response;
    let callbackResponse: request.Response;
    let cookies: string;
    let cookieString: string;
    let state: string;

    Given("the user is logged in with valid tokens", () => {
      const idToken = generateIdToken({ name: "John Doe" }, { algorithm: "RS256", expiresIn: "10m" });
      const cookieValue = `j:${JSON.stringify({
        accessToken: "test-access-token",
        idToken,
        refreshToken: "test-refresh-token",
        expiresIn: 600,
      })}`;
      cookieString = `bnoidctokens=${encodeURIComponent(cookieValue)}`;
    });

    When("user navigates to /id/logout", async () => {
      logoutResponse = await request(app).get("/id/logout?return-path=%2Ftest")
        .set("Cookie", cookieString);
    });

    Then("user is redirected to the OIDC provider for logout", () => {
      expect(logoutResponse.status).to.equal(302);
      const locationUrl = new URL(logoutResponse.header.location);
      expect(locationUrl.origin).to.equal(issuerBaseURL);
      expect(locationUrl.pathname).to.equal("/oauth/logout");
      expect(locationUrl.searchParams.get("client_id")).to.equal(clientId);
      expect(locationUrl.searchParams.get("post_logout_redirect_uri")).to.equal(`${baseURL}/id/logout/callback?return-path=%2Ftest`);
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
        .get("/id/logout/callback?return-path=%2Ftest&state=incorrect-state")
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
        .get(`/id/logout/callback?return-path=%2Ftest&state=${state}`)
        .set("Cookie", cookies);
    });

    Then("logout token is removed and user is redirected", () => {
      expect(callbackResponse.status).to.equal(302);
      expect(callbackResponse.header.location).to.equal("/test");
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader).to.have.property("bnoidclogout");
      expect(parsedSetCookieHeader.bnoidclogout).to.be.a("null");
    });

    When("OIDC provider redirects back to the callback endpoint", async () => {
      customCallbackCalled = false;
      callbackResponse = await request(app)
        .get(`/id/logout/callback?return-path=%2Ftest&state=${state}&post_logout_callback=true`)
        .set("Cookie", cookies);
    });

    Then("logout token is removed and user is redirected", () => {
      expect(customCallbackCalled).to.be.true;
      expect(callbackResponse.status).to.equal(302);
      expect(callbackResponse.header.location).to.equal("/some-custom-redirect-path");
      parsedSetCookieHeader = parseSetCookieHeader(callbackResponse.header["set-cookie"]);
      expect(parsedSetCookieHeader).to.have.property("bnoidclogout");
      expect(parsedSetCookieHeader.bnoidclogout).to.be.a("null");

    });
  });
});
