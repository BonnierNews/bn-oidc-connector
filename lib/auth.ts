import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";
import Joi from "joi";
import jwksClient, { type JwksClient, type SigningKey } from "jwks-rsa";
import cookieParser from "cookie-parser";

import {
  queryParams,
  requestContext,
  idToken,
} from "./middleware";
import type {
  AuthOptions,
  OidcClientConfig,
  OidcConfig,
  OidcWellKnownConfig,
} from "./types";
import { InitOidcError, DiscoveryFailedError } from "./errors";

const defaultConfig: OidcClientConfig = {
  clientId: "",
  issuerBaseURL: new URL("https://example.com"),
  baseURL: new URL("https://example.com"),
  loginPath: "/id/login",
  logoutPath: "/id/logout",
  loginCallbackPath: "/id/login/callback",
  logoutCallbackPath: "/id/logout/callback",
  scopes: [ "openid", "entitlements", "offline_access" ],
  prompts: [], // TODO: Should we have any default prompts?
  cookies: {
    authParams: "bnoidcauthparams",
    tokens: "bnoidctokens",
    logout: "bnoidclogout",
  },
};

const configSchema = Joi.object({
  clientId: Joi.string().required(),
  issuerBaseURL: Joi.object().instance(URL).required(),
  baseURL: Joi.object().instance(URL).required(),
  loginPath: Joi.string().optional(),
  logoutPath: Joi.string().optional(),
  loginCallbackPath: Joi.string().optional(),
  logoutCallbackPath: Joi.string().optional(),
  scopes: Joi.array().items(Joi.string()).optional(),
  prompts: Joi.array().items(Joi.string()).optional(),
  cookies: Joi.object({
    authParams: Joi.string().optional(),
    tokens: Joi.string().optional(),
    logout: Joi.string().optional(),
  }),
}).required();

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider
 * and register required routes.
 */
function auth(options: AuthOptions): Router {
  const clientConfig = {
    ...defaultConfig,
    ...options,
  };
  let wellKnownConfig: OidcWellKnownConfig;
  let signingKeys: SigningKey[];

  const validation = configSchema.validate(clientConfig);
  if (validation.error) {
    throw new InitOidcError("OIDC client config is missing required parameters");
  }

  const initializePromise = initialize(clientConfig);

  const getConfig = (): OidcConfig => ({
    clientConfig,
    wellKnownConfig,
    signingKeys,
  });

  const ensureInitialized = async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      ({ wellKnownConfig, signingKeys } = await initializePromise);

      if (!clientConfig || !wellKnownConfig) {
        next(new InitOidcError("OIDC provider not initialized"));

        return;
      }
    } catch (error) {
      next(error);

      return;
    }

    next();
  };

  const router = createRouter();

  router.use(cookieParser());
  router.use(ensureInitialized);
  router.use(requestContext(getConfig));
  router.use(idToken);
  router.use(queryParams);

  router.get(clientConfig.loginPath as string, (req: Request, res: Response) => {
    req.oidc.login(req, res, req.query["return-path"] ? { returnPath: req.query["return-path"] as string } : {});
  });

  router.get(clientConfig.logoutPath as string, (req: Request, res: Response) => {
    req.oidc.logout(req, res, req.query["return-path"] ? { returnPath: req.query["return-path"] as string } : {});
  });

  router.get(clientConfig.loginCallbackPath as string, (req: Request, res: Response) => {
    req.oidc.loginCallback(req, res);
  });

  router.get(clientConfig.logoutCallbackPath as string, (req: Request, res: Response) => {
    req.oidc.logoutCallback(req, res);
  });

  return router;
}

async function initialize(clientConfig: OidcClientConfig): Promise<OidcConfig> {
  try {
    // Fetch OIDC well-known configuration
    const response = await fetch(new URL(
      "oauth/.well-known/openid-configuration",
      clientConfig.issuerBaseURL.toString()
    ));

    if (!response.ok) {
      throw new Error(`ID service responded with ${response.status}`);
    }

    const wellKnownConfig: OidcWellKnownConfig = await response.json();

    // Fetch JWKS
    const client: JwksClient = jwksClient({
      jwksUri: wellKnownConfig?.jwks_uri ?? "/oauth/jwks",
      timeout: 5000,
    });

    const signingKeys = await client.getSigningKeys();

    return { clientConfig, wellKnownConfig, signingKeys };
  } catch (error) {
    throw new DiscoveryFailedError(`OIDC discovery failed: ${(error as Error).message}`);
  }
}

export { auth, initialize };
