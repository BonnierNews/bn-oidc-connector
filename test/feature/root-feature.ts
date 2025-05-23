import request from "supertest";

import { app } from "../../app";

Feature("visiting the application", () => {
  Scenario("Visiting /", () => {
    When("Requesting / will return 200", async () => {
      const response = await request(app).get("/");
      expect(response.statusCode).to.equal(200);
    });
  });
});
