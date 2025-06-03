import { Router as createRouter, type Router } from "express";
/**
 * Express middleware to be used to connect to Bonnier OIDC provider and register reguired routes.
 */

type ClientConfig = {
  clientId: string;
  issuerBaseURL: string;
};

// type OIDCWellKnownConfig = {
//   issuer: string;
//   authorization_endpoint: string;
//   token_endpoint: string;
//   userinfo_endpoint: string;
//   jwks_uri: string;
//   end_session_endpoint: string;
//   scopes_supported: string[];
//   response_types_supported: string[];
//   grant_types_supported: string[];
//   subject_types_supported: string[];
//   id_token_signing_alg_values_supported: string[];
//   ui_locales_supported: string[];
// };

export const middleware = async (clientConfig: ClientConfig): Promise<Router> => {
  const router = createRouter();
  const { clientId, issuerBaseURL } = clientConfig;

  await fetch(`${issuerBaseURL}/oauth/.well-known/openid-configuration`);
  // const response = await fetch(`${issuerBaseURL}/oauth/.well-known/openid-configuration`);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const wellknownConfig: OIDCWellKnownConfig = await response.json();

  router.use((_req, _res, next) => {
    // do any required setup
    return next();
  });

  router.post("/callback", (_req, res) => {
    res.send(`Callback received for client ID: ${clientId}`);
  });

  return router;
};
