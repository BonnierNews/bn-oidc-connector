import nock from "nock";

import { auth } from "../../index";
import { initialize } from "../../lib/auth";
import type { OidcClientConfig } from "../../lib/types";

const clientId = "test-client-id";
const issuerBaseURL = "https://oidc.test";
const baseURL = "http://test.example";

Feature("Setup", () => {
  Scenario("Middleware is not initialized", () => {
    let config : any;

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
        await initialize({
          clientId,
          issuerBaseURL: new URL(issuerBaseURL),
          baseURL: new URL(baseURL),
          loginPath: "/id/login",
          loginCallbackPath: "/id/login/callback",
          logoutPath: "/id/logout",
          logoutCallbackPath: "/id/logout/callback",
          scopes: [ "profile", "email", "entitlements", "offline_access" ],
          prompts: [],
          cookies: {
            authParams: "bnoidcap",
            tokens: {
              access: "bnoidcat",
              refresh: "bnoidcrt",
              id: "bnoidcit",
              expiresIn: "bnoidcei",
            },
            logout: "bnoidclo",
          },
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
