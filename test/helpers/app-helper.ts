import cookieParser from "cookie-parser";
import express from "express";
// import express, { Router } from "express";

// import { middleware as createMiddleware, type ClientConfig } from "../../lib/middleware";
import { auth, type ClientConfig } from "../../index";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  return app;
};

const createAppWithMiddleware = (clientConfig: ClientConfig) => {
  const app = createApp();
  // const middleware: Router = await createMiddleware(clientConfig);
  app.use(auth(clientConfig));
  return app;
};

export {
  createApp,
  createAppWithMiddleware,
};
