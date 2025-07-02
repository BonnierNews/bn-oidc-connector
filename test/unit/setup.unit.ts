// import { type Request, type Response } from "express";
import nock from "nock";

import { auth, type OidcClientConfig } from "../../index";
import { initialize } from "../../lib/middleware";

// import { handleCallback } from "../../lib/callback";
// import { handleLogin } from "../../lib/login";
// import { createApp, createAppWithMiddleware } from "../helpers/app-helper";

// const clientId = "test-client-id";
// const issuerBaseURL = "https://oidc.test";
// const baseURL = "http://test.example";

Feature("Setup", () => {
  Scenario("Middleware is not initialized", () => {
    let config;
    Given("config is missing required params", () => {
      config = {};
    });
    let error: Error | null = null;
    When("creating oidc middleware without config", () => {
      try {
        auth(config as OidcClientConfig);
      } catch (err) {
        error = err as Error;
      }
    });
    Then("an error is thrown", () => {
      expect(error).to.be.an.instanceOf(Error);
      expect(error?.message).to.equal("OIDC client config is missing required parameters");
    });
  });

  // Scenario("Initializing middleware with invalid config", () => {
  //   let config: Partial<OidcClientConfig> | null = null;
  //   When("initializing middleware with invalid config", () => {
  //     config = {};
  //   });
  //
  //   Then("an error is thrown", () => {
  //     expect(() => auth(config as OidcClientConfig)).to.throw("OIDC client config is missing required parameters");
  //   });
  // });

  Scenario("Middleware fails initialization", () => {
    const clientId = "test-client-id";
    const issuerBaseURL = "https://oidc.test";
    const baseURL = "http://test.example";

    Given("the OIDC provider cannot be reached", () => {
      nock(issuerBaseURL)
        .get("/oauth/.well-known/openid-configuration")
        .times(1)
        .reply(404);
    });

    let initializationError: Error;
    When("initializing the middleware", async () => {
      try {
        await initialize({
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
      expect(initializationError.message).to.include("ID service responded with 404");
    });
  });
});
