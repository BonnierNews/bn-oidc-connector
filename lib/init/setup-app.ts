import http from "http";
import https from "https";
import express from "express";

import { errorHandler } from "./error-handler";
import { routes } from "./routes";
import { middleware } from "./middleware";

export function setupApp() {
  const app = express();

  // Don't limit the number of outgoing HTTP requests (defaults to 4 simultaneous requests)
  http.globalAgent.maxSockets = Infinity;
  https.globalAgent.maxSockets = Infinity;

  // Make sure dates are displayed in the correct timezone
  process.env.TZ = "Europe/Stockholm";

  app.disable("x-powered-by");

  middleware(app);
  routes(app);

  app.use(errorHandler);
  return app;
}
