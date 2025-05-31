import {
  Router as createRouter,
  type NextFunction,
  type Router,
  type Request,
  type Response,
} from "express";

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
  issuerBaseURL: string;
  baseURL: string; // TODO: Better name?
  loginPath?: string; // Path to the login endpoint, defaults to "/id/login"
  callbackPath?: string; // Path to the callback endpoint, defaults to "/id/callback"
  logoutPath?: string; // Path to the logout endpoint, defaults to "/id/logout"
  cookieDomain?: string; // Domain for the cookie, defaults to the current domain
};

let clientConfig: ClientConfig;
let wellKnownConfig: OIDCWellKnownConfig;

/**
 * Redirects the user to the OIDC provider for login with the necessary parameters.
 */
const login = (res: Response, returnUri: string) => {
  if (!clientConfig || !wellKnownConfig) {
    throw new Error("Middleware must be initialized before calling login");
  }

  const authorizationUrl = new URL(
    wellKnownConfig.authorization_endpoint, clientConfig.issuerBaseURL
  );
  const redirectUri = new URL(
    `${clientConfig.baseURL}${clientConfig.callbackPath}?returnUri=${returnUri}`
  );

  authorizationUrl.searchParams.append("client_id", clientConfig.clientId);
  authorizationUrl.searchParams.append("response_type", "code");
  authorizationUrl.searchParams.append("scope", "openid profile email entitlements offline_access");
  authorizationUrl.searchParams.append("redirect_uri", redirectUri.toString());
  authorizationUrl.searchParams.append("state", "xyz"); // TODO: generate a secure random state
  authorizationUrl.searchParams.append("nonce", "abc"); // TODO: generate a secure random nonce

  res.redirect(authorizationUrl.toString());
};

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

  const response = await fetch(`${clientConfig.issuerBaseURL}/oauth/.well-known/openid-configuration`);
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

      login(res, returnUri);

      return;
    }

    return next();
  });

  /**
   * Handles the login route by redirecting to the OIDC provider.
   */
  router.get(clientConfig.loginPath as string, (_req, res) => {
    login(res, "/test");
  });

  /**
   * Handles the callback route by exchanging the authorization code for tokens.
   */
  router.get(clientConfig.callbackPath as string, async (req, res) => {
    const tokenResponse = await fetch(wellKnownConfig.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientConfig.clientId,
        grant_type: "authorization_code",
        code: req.query.code as string,
        redirect_uri: `${clientConfig.baseURL}${clientConfig.callbackPath}`,
      }),
    });

    const tokens = JSON.parse(await tokenResponse.text());

    res.cookie("tokens", tokens, {
      domain: clientConfig.cookieDomain ?? req.hostname,
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });

    res.redirect(req.query.returnUri as string || "/");
  });

  return router;
};

export {
  middleware,
  login,
  ClientConfig,
};
