import { type Request, type Response } from "express";
import nock from "nock";

import { handleCallback } from "../../lib/callback";
import { handleLogin } from "../../lib/login";
import { createApp, createAppWithMiddleware } from "../helpers/app-helper";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Setup", () => {
  Scenario("Middleware is not initialized", () => {
    Given("app is created without the middleware initialized", () => {
      createApp();
    });

    When("login handler is throws the error", () => {
      expect(handleLogin).to.throw(Error, "Middleware must be initialized before calling login");
    });

    When("callback handler is throws the error", async () => {
      try {
        await handleCallback({} as Request, {} as Response);
      } catch (error) {
        expect(error).to.be.an.instanceOf(Error);
        expect((error as Error).message).to.equal("Middleware must be initialized before calling callback");
      }
    });
  });

  Scenario("Middleware fails initialization", () => {
    Given("the OIDC provider cannot be reached", () => {
      nock(issuerBaseURL)
        .get("/oauth/.well-known/openid-configuration")
        .times(1)
        .reply(404);
    });

    let initializationError: Error;
    When("initializing the middleware", async () => {
      try {
        await createAppWithMiddleware({
          clientId,
          issuerBaseURL: new URL(issuerBaseURL),
          baseURL: new URL(baseURL),
          scopes: [ "profile", "email", "entitlements", "offline_access" ],
        });
      } catch (error) {
        initializationError = error as Error;
      }
    });

    Then("the error is thrown", () => {
      expect(initializationError).to.be.an.instanceOf(Error);
    });
  });
});
