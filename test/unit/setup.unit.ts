import { handleLogin } from "../../lib/login";
import { createApp } from "../helpers/app-helper";

Feature("Setup", () => {

  Scenario("Middleware is not initialized", () => {
    Given("app is created without the middleware initialized", () => {
      createApp();
    });

    When("login handler is throws the error", () => {
      expect(handleLogin).to.throw(Error, "Middleware must be initialized before calling login");
    });
  });
});
