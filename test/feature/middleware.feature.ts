import { Router } from "express";
import request from "supertest";

import { createApp } from "../helpers/app-helper";
import { middleware as createMiddleware } from "../../lib/middleware";

Feature("visiting the application", () => {
  const app = createApp();
  const middleware: Router = createMiddleware({ clientId: "test-client-id" });
  app.use(middleware);

  Scenario("Visiting /", () => {
    When("Middleware will execute callback", async () => {
      const res = await request(app)
        .post("/callback");

      expect(res.status).to.equal(200);
    });
  });
});
