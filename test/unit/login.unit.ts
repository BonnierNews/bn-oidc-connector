import { custom } from "joi";

import { generateAuthorizationUrl } from "../../lib/handlers/login";
import type { AuthorizationUrlOptions } from "../../lib/types";

Feature("login", () => {

  Scenario("call generateAuthorizationUrl()", () => {

    let response: any;
    When("calling generateAuthorizationUrl() with custom prompts", () => {

      response = generateAuthorizationUrl({
        clientId: "test-client-id",
        authorizationEndpoint: "https://oidc.test//oauth/authorize",
        scopes: [ "openid", "profile", "email" ],
        redirectUri: new URL("http://test.example/id/callback"),
        state: "test-state",
        nonce: "test-nonce",
        codeChallenge: "test-code-challenge",
        codeChallengeMethod: "S256",
        prompts: [],
      } as AuthorizationUrlOptions);

    });

    Then("the generated URL contains no prompts param", () => {
      expect(response).to.be.an.instanceOf(URL);
      expect(response.searchParams.get("prompts")).to.eql(null);
    });

    When("calling generateAuthorizationUrl() with custom prompts", () => {
      response = generateAuthorizationUrl({
        clientId: "test-client-id",
        authorizationEndpoint: "https://oidc.test//oauth/authorize",
        scopes: [ "openid", "profile", "email" ],
        redirectUri: new URL("http://test.example/id/callback"),
        state: "test-state",
        nonce: "test-nonce",
        codeChallenge: "test-code-challenge",
        codeChallengeMethod: "S256",
        prompts: [ "login", "consent" ],
      } as AuthorizationUrlOptions);
    });

    Then("the generated URL contains a prompt param with two values", () => {
      expect(response).to.be.an.instanceOf(URL);
      expect(response.toString()).to.eql("https://oidc.test//oauth/authorize?client_id=test-client-id&response_type=code&scope=openid+profile+email&redirect_uri=http%3A%2F%2Ftest.example%2Fid%2Fcallback&state=test-state&nonce=test-nonce&code_challenge=test-code-challenge&code_challenge_method=S256&prompt=login+consent");
    });
  });
});
