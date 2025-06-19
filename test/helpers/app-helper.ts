import cookieParser from "cookie-parser";
import express from "express";

import { auth, type OidcClientConfig } from "../../index";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  return app;
};

const createAppWithMiddleware = (clientConfig: OidcClientConfig) => {
  const app = createApp();
  app.use(auth(clientConfig));
  return app;
};

export {
  createApp,
  createAppWithMiddleware,
};
