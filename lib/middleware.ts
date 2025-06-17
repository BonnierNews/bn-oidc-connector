import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";

import {
  callback,
  login,
} from "./handlers";
import { Context, LoginOptions, OidcClient } from "./types";

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
  locale?: string; // Locale to override the OIDC provider app default locale
  scopes?: string[]; // Scopes to request during login, defaults to ["openid", "profile", "email", "entitlements", "offline_access"]
  prompts?: string[]; // Custom prompts to add to the login request
};

const defaults: Partial<ClientConfig> = {
  loginPath: "/id/login",
  callbackPath: "/id/callback",
  scopes: [ "openid", "entitlements", "offline_access" ],
  prompts: [], // TODO: Should we have any default prompts?
};

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider and
 * register required routes.
 */
function createOidcMiddleware(config: ClientConfig): Router {
  const clientConfig = { ...defaults, ...config };
  let wellKnownConfig: OIDCWellKnownConfig | null = null;

  async function initialize(): Promise<void> {
    try {
      const response = await fetch(new URL(
        "oauth/.well-known/openid-configuration",
        clientConfig.issuerBaseURL.toString()
      ));

      if (!response.ok) {
        throw new Error(`ID service responded with ${response.status}`);
      }

      wellKnownConfig = await response.json();
    } catch (error) {
      throw new Error(`OIDC discovery failed: ${(error as Error).message}`);
    }
  }

  const initializePromise = initialize();

  const getContext = (): Context => ({
    clientConfig,
    wellKnownConfig: wellKnownConfig!,
  });

  const createOidcClient = (): OidcClient => ({
    login: (res, options) => login(getContext(), res as Response, options),
    callback: (req, res) => callback(getContext(), req as Request, res as Response),
  });

  const router = createRouter();

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the OIDC provider is initialized before proceeding
      await initializePromise;

      if (!wellKnownConfig) {
        // TODO: Throw error instead?
        res.status(500).send("OIDC provider not initialized");

        return;
      }
    } catch (error) {
      res.status(500).send("OIDC middleware initialization failed");

      return;
    }

    req.oidc = createOidcClient();

    // Check for query parameters to handle login
    const { idlogin, ...queryParameters } = req.query as Record<string, string>;

    if (idlogin) {
      const searchParams = new URLSearchParams(queryParameters);
      const options: LoginOptions = {
        returnUri: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
        prompts: idlogin === "silent" ? [ "none" ] : [],
      };

      req.oidc!.login(res, options);

      return;
    }

    next();
  };

  router.get(clientConfig.loginPath as string, middleware, (req: Request, res: Response) => {
    // TODO: Remove fallback returnUri and get it from config in the login handler
    req.oidc!.login(res, { returnUri: req.query["return-uri"] as string ?? "/" });
  });

  router.get(clientConfig.callbackPath as string, middleware, (req: Request, res: Response) => {
    req.oidc!.callback(req, res);
  });

  return router.use(middleware);
}

export { createOidcMiddleware };
