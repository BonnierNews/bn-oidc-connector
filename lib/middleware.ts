import { Router as createRouter, type Router } from "express";
/**
 * Express middleware to be used to connect to Bonnier OIDC provider and register reguired routes.
 */

type ClientConfig = {
  clientId: string;
  issuerBaseURL: string;
  baseURL: string;
};

type OIDCWellKnownConfig = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  ui_locales_supported: string[];
};

export const middleware = async (clientConfig: ClientConfig): Promise<Router> => {
  const router = createRouter();
  const { clientId, issuerBaseURL, baseURL } = clientConfig;

  const response = await fetch(`${issuerBaseURL}/oauth/.well-known/openid-configuration`);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const wellknownConfig: OIDCWellKnownConfig = await response.json();

  router.use((_req, _res, next) => {
    // do any required setup
    return next();
  });

  router.get("/id/login", (_req, res) => {
    res.redirect(
      `${issuerBaseURL}/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid profile email entitlements externalIds offline_access&redirect_uri=${encodeURIComponent(
        `${baseURL}/id/callback?returnUri=/test`
      )}&state=xyz&nonce=abc`
    );
    // res.send(`Callback received for client ID: ${clientId}`);
  });

  router.get("/id/callback", async (req, res) => {
    const tokenResponse = await fetch(`${issuerBaseURL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code: req.query.code as string,
        redirect_uri: `${baseURL}/id/callback`,
      }),
    });

    const tokens = JSON.parse(await tokenResponse.text());

    // @todo Fetch domain from config
    res.cookie("tokens", tokens, {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });

    res.redirect(req.query.returnUri as string || "/");
  });

  return router;
};
