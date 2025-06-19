import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";
import Joi from "joi";

import {
  callback,
  login,
  logout,
  refresh,
} from "./handlers";
import {
  Context,
  LoginOptions,
  OidcClientConfig,
  OidcClient,
  OidcWellKnownConfig,
} from "./types";

const defaults: Partial<OidcClientConfig> = {
  loginPath: "/id/login",
  callbackPath: "/id/callback",
  scopes: [ "openid", "entitlements", "offline_access" ],
  prompts: [], // TODO: Should we have any default prompts?
};

const configSchema = Joi.object({
  clientId: Joi.string().required(),
  issuerBaseURL: Joi.object().instance(URL).required(),
  baseURL: Joi.object().instance(URL).required(),
  loginPath: Joi.string().optional(),
  callbackPath: Joi.string().optional(),
  scopes: Joi.array().items(Joi.string()).optional(),
  prompts: Joi.array().items(Joi.string()).optional(),
}).required();

/**
 * Express middleware to be used to connect to Bonnier News OIDC provider and
 * register required routes.
 */
function createOidcMiddleware(config: OidcClientConfig): Router {
  const clientConfig = { ...defaults, ...config };
  let wellKnownConfig: OidcWellKnownConfig | null = null;
  const validation = configSchema.validate(clientConfig);
  if (validation.error) {
    throw new Error("OIDC client config is missing required parameters");
  }

  const initializePromise = initialize(clientConfig);

  const getContext = (): Context => ({
    clientConfig,
    wellKnownConfig: wellKnownConfig!,
  });

  const createOidcClient = (): OidcClient => ({
    login: (res, options) => login(getContext(), res as Response, options),
    callback: (req, res) => callback(getContext(), req as Request, res as Response),
    refresh: (req, res) => refresh(getContext(), req as Request, res as Response),
    logout: (res) => logout(getContext(), res as Response),
  });

  const oidcClientMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the OIDC provider is initialized before proceeding
      wellKnownConfig = await initializePromise;

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

  const oidcQueryParamsMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

  const router = createRouter();

  router.use(oidcClientMiddleware);
  router.use(oidcQueryParamsMiddleware);

  router.get(clientConfig.loginPath as string, (req: Request, res: Response) => {
    // TODO: Remove fallback returnUri and get it from config in the login handler
    req.oidc!.login(res, { returnUri: req.query["return-uri"] as string ?? "/" });
  });

  router.get(clientConfig.callbackPath as string, (req: Request, res: Response) => {
    req.oidc!.callback(req, res);
  });

  return router;
}

async function initialize(clientConfig: OidcClientConfig): Promise<OidcWellKnownConfig> {
  try {
    const response = await fetch(new URL(
      "oauth/.well-known/openid-configuration",
      clientConfig.issuerBaseURL.toString()
    ));

    if (!response.ok) {
      throw new Error(`ID service responded with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`OIDC discovery failed: ${(error as Error).message}`);
  }
}

export { createOidcMiddleware, initialize };
