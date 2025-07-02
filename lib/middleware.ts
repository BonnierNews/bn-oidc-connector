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
  loginCallback,
  logoutCallback,
  login,
  logout,
  refresh,
} from "./handlers";
import {
  Context,
  OidcClientConfig,
  OidcClient,
  OidcWellKnownConfig,
} from "./types";
import { getTokensCookie } from "./utils/cookies";
import { verifyJwt } from "./utils/jwt";

const defaults: Partial<OidcClientConfig> = {
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
  }).optional(),
}).required();

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider and
 * register required routes.
 */
function createOidcMiddleware(config: OidcClientConfig): Router {
  const clientConfig = { ...defaults, ...config };
  let wellKnownConfig: OidcWellKnownConfig | null = null;
  let signingKeys: SigningKey[];

  const validation = configSchema.validate(clientConfig);
  if (validation.error) {
    throw new Error("OIDC client config is missing required parameters");
  }

  const initializePromise = initialize(clientConfig);

  const getContext = (): Context => ({
    clientConfig,
    wellKnownConfig: wellKnownConfig!,
    signingKeys,
  });

  const createOidcClient = (): OidcClient => ({
    login: (res, options) => login(getContext(), res as Response, options),
    loginCallback: (req, res) => loginCallback(getContext(), req as Request, res as Response),
    logoutCallback: (req, res) => logoutCallback(getContext(), req as Request, res as Response),
    refresh: async (req, res) => await refresh(getContext(), req as Request, res as Response),
    logout: (req, res, options) => logout(getContext(), req as Request, res as Response, options),
  });

  const oidcClientMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Ensure the OIDC provider is initialized before proceeding
    try {
      ({ wellKnownConfig, signingKeys } = await initializePromise);

      if (!clientConfig || !wellKnownConfig) {
        // TODO: Throw error instead?
        res.status(500).send("OIDC provider not initialized");

        return;
      }
    } catch (error) {
      res.status(500).send("OIDC middleware initialization failed");

      return;
    }

    req.oidc = createOidcClient();

    next();
  };

  const oidcTokensMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Ensure the OIDC provider is initialized before proceeding
    if (!req.oidc) {
      // TODO: Throw error instead?
      res.status(500).send("OIDC client not initialized");

      return;
    }

    // Attach tokens to the request object
    const tokens = getTokensCookie(clientConfig, req);

    // Verify ID token if present
    if (tokens?.idToken) {
      try {
        const validIdToken = verifyJwt(tokens.idToken, signingKeys, {
          issuer: wellKnownConfig!.issuer,
          audience: clientConfig.clientId,
        });
      } catch (error) {
        console.error("Failed to verify ID token:", error);
        res.status(401).send("Invalid ID token");

        return;
      }
    }

    next();
  };

  const oidcQueryParamsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const { idlogin, idrefresh, ...queryParameters } = req.query as Record<string, string>;

    if (idlogin) {
      const searchParams = new URLSearchParams(queryParameters);

      req.oidc!.login(res, {
        returnUri: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
        prompts: idlogin === "silent" ? [ "none" ] : [],
      });

      return;
    }

    if (idrefresh && req.oidc) {
      await req.oidc.refresh(req, res);

      next();

      return;
    }

    next();
  };

  const router = createRouter();
  router.use(cookieParser());
  router.use(oidcClientMiddleware);
  router.use(oidcTokensMiddleware);
  router.use(oidcQueryParamsMiddleware);

  router.get(clientConfig.loginPath as string, (req: Request, res: Response) => {
    // TODO: Remove fallback returnUri and get it from config in the login handler
    req.oidc!.login(res, { returnUri: req.query["return-uri"] as string ?? "/" });
  });

  router.get(clientConfig.logoutPath as string, (req: Request, res: Response) => {
    // TODO: Remove fallback returnUri and get it from config in the login handler
    req.oidc!.logout(req, res, { returnUri: req.query["return-uri"] as string ?? "/" });
  });

  router.get(clientConfig.loginCallbackPath as string, (req: Request, res: Response) => {
    req.oidc!.loginCallback(req, res);
  });

  router.get(clientConfig.logoutCallbackPath as string, (req: Request, res: Response) => {
    req.oidc!.logoutCallback(req, res);
  });

  return router;
}

async function initialize(clientConfig: OidcClientConfig): Promise<Context> {
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
    throw new Error(`OIDC discovery failed: ${(error as Error).message}`);
  }
}

export { createOidcMiddleware, initialize };
