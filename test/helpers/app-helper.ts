import express from "express";

import { auth, type AuthOptions } from "../../index";

const createApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

const createAppWithMiddleware = (clientConfig: AuthOptions) => {
  const app = createApp();
  app.use(auth(clientConfig));
  return app;
};

export {
  createApp,
  createAppWithMiddleware,
};
