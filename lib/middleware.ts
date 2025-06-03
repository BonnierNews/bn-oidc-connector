import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";

import { login } from "./login";

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

type ClientConfig = {
  clientId: string;
  clientSecret?: string;
  issuerBaseURL: URL;
  baseURL: URL; // TODO: Better name?
  loginPath?: string; // Path to the login endpoint, defaults to "/id/login"
  callbackPath?: string; // Path to the callback endpoint, defaults to "/id/callback"
  logoutPath?: string; // Path to the logout endpoint, defaults to "/id/logout"
  cookieDomain?: URL; // Domain where cookies should be set. TODO: Should this be forced?
};

let clientConfig: ClientConfig;
let wellKnownConfig: OIDCWellKnownConfig;

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider and
 * register required routes.
 */
const middleware = async (config: ClientConfig): Promise<Router> => {
  const defaults = {
    loginPath: "/id/login",
    callbackPath: "/id/callback",
  };

  clientConfig = { ...defaults, ...config };

  const router = createRouter();

  // TODO: Add error handling for fetch requests
  const response = await fetch(`${clientConfig.issuerBaseURL}oauth/.well-known/openid-configuration`);
  wellKnownConfig = await response.json();

  /**
   * Middleware to check for query parameters.
   */
  router.use((req: Request, res: Response, next: NextFunction) => {
    // TODO: For a proper autologin, we should add the prompt "none" to the login request
    if (req.query.autologin) {
      const searchParams = new URLSearchParams(req.query as Record<string, string>);
      searchParams.delete("autologin");
      let returnUri = req.path;

      if (searchParams.size > 0) {
        returnUri += `?${searchParams.toString()}`;
      }

      // TODO: Add options type
      // const options = {
      //   returnUri,
      // };
      //
      // if (req.query.login === "silent") {
      //   options.prompt = "none";
      // }

      login(res, returnUri as string);

      return;
    }

    return next();
  });

  /**
   * Handles the login route by redirecting to the OIDC provider.
   */
  router.get(clientConfig.loginPath as string, (req: Request, res: Response) => {
    const returnUri = req.query["return-uri"] ?? "/";

    login(res, returnUri as string);
  });

  /**
   * Handles the callback route by exchanging the authorization code for tokens.
   */
  router.get(clientConfig.callbackPath as string, async (req: Request, res: Response) => {
    const { state: incomingState } = req.query;
    const { state: storedState, codeVerifier } = req.cookies.bnoidcauthparams;
    const returnUri = req.query["return-uri"] ?? "/";

    if (incomingState !== storedState) {
      res.status(400).send("Invalid state parameter");

      return;
    }

    const tokenResponse = await fetch(wellKnownConfig.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientConfig.clientId,
        grant_type: "authorization_code",
        code: req.query.code as string,
        redirect_uri: `${clientConfig.baseURL}${clientConfig.callbackPath}`,
        code_verifier: codeVerifier,
      }),
    });

    const tokens = JSON.parse(await tokenResponse.text());

    res.cookie("bnoidctokens", tokens, {
      domain: clientConfig.cookieDomain?.hostname ?? req.hostname,
      httpOnly: true,
      secure: new URL(clientConfig.baseURL).protocol === "https:",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });

    res.redirect(returnUri as string);
  });

  return router;
};

const getClientConfig = (): ClientConfig => {
  return clientConfig;
};

const getWellKnownConfig = (): OIDCWellKnownConfig => {
  return wellKnownConfig;
};

export {
  OIDCWellKnownConfig,
  ClientConfig,
  middleware,
  getClientConfig,
  getWellKnownConfig,
};
