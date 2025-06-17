import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";

import { handleCallback } from "./callback";
import { handleLogin } from "./login";

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

let clientConfig: ClientConfig | undefined;
let wellKnownConfig: OIDCWellKnownConfig | undefined;

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider and
 * register required routes.
 */
const middleware = async (config: ClientConfig): Promise<Router> => {
  clientConfig = { ...defaults, ...config };

  const router = createRouter();

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

  // Query parameter middleware
  router.use((req: Request, res: Response, next: NextFunction) => {
    const { idlogin, ...queryParameters } = req.query as Record<string, string>;

    if (idlogin) {
      const searchParams = new URLSearchParams(queryParameters);
      const returnUri = searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path;
      const prompts = idlogin === "silent" ? [ "none" ] : [];

      handleLogin(res, { returnUri, prompts });

      return;
    }

    return next();
  });

  // Login route
  router.get(clientConfig.loginPath as string, (req: Request, res: Response) => {
    handleLogin(res, { returnUri: (req.query["return-uri"] as string) ?? "/" });
  });

  // Callback route
  router.get(clientConfig.callbackPath as string, async (req: Request, res: Response) => {
    await handleCallback(req, res);
  });

  return router;
};

const getClientConfig = (): ClientConfig | undefined => {
  return { ...clientConfig } as ClientConfig | undefined;
};

const getWellKnownConfig = (): OIDCWellKnownConfig | undefined => {
  return { ...wellKnownConfig } as OIDCWellKnownConfig | undefined;
};

export {
  OIDCWellKnownConfig,
  ClientConfig,
  middleware,
  getClientConfig,
  getWellKnownConfig,
};
