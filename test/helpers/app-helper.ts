import cookieParser from "cookie-parser";
import express, { Router } from "express";

import { middleware as createMiddleware, type ClientConfig } from "../../lib/middleware";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.listen(3000);
  return app;
};

const createAppWithMiddleware = async (clientConfig: ClientConfig) => {
  const app = createApp();
  const middleware: Router = await createMiddleware(clientConfig);
  app.use(middleware);
  return app;
};

export {
  createApp,
  createAppWithMiddleware,
};
