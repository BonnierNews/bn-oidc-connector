import express from "express";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.listen(3000);
  return app;
};
