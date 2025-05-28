import { Router as createRouter, type Router } from "express";
/**
 * Express middleware to be used to connect to Bonnier OIDC provider and register reguired routes.
 */

interface ClientConfig {
  clientId: string;
  issuerBaseURL: string;
}

export const middleware = async (clientConfig: ClientConfig): Promise<Router> => {
  const router = createRouter();
  const { clientId, issuerBaseURL } = clientConfig;

  const response = await fetch(`${issuerBaseURL}/oauth/.well-known/openid-configuration`);

  router.use((_req, _res, next) => {
    // do any required setup
    return next();
  });

  router.post("/callback", (_req, res) => {
    res.send(` Callback received for client ID: ${clientId}`);
  });

  return router;
};
