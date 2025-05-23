import { RequestHandler } from "express";

import { middleware as createMiddleware } from "../../lib/middleware";

Feature("visiting the application", () => {
  let middleware: RequestHandler;

  beforeEachScenario(() => {
    middleware = createMiddleware();
  });

  Scenario("Visiting /", () => {
    When("Middleware will execute callback", () => {
      const cb = () => {
        // eslint-disable-next-line no-console
        console.log("Middleware called");
      };

      // Minimal mock of Express Request object
      const req = {
        header: () => "test",
        get: () => "test",
        accepts: () => true,
        acceptsCharsets: () => true,
        acceptsEncodings: () => true,
        acceptsLanguages: () => true,
        // Add any other required properties/methods as needed
      } as any;

      // Minimal mock of Express Request object
      const res = {} as any;

      middleware(req, res, cb);
      expect(true);
    });
  });
});
