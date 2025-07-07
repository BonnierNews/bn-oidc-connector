import type { Request as ExpressRequest, Response } from "express";
import type { SigningKey } from "jwks-rsa";

type LoginOptions = {
  returnUri?: string;
  scopes?: string[];
  prompts?: string[];
};

type VerifyOptions = {
  issuer: string;
  audience: string;
};

type LogoutOptions = {
  returnUri?: string;
};

// TODO: Create a type for the OIDC client configuration options sent in by the client
//       and let this "complete" type extend it. That way, we only need to have truly
//       optional properties as optional (like cookieDomainURL).
type OidcClientConfig = {
  clientId: string;
  clientSecret?: string;
  issuerBaseURL: URL;
  baseURL: URL;
  loginPath?: string; // Path to the login endpoint, defaults to "/id/login"
  loginCallbackPath?: string; // Path to the login callback endpoint, defaults to "/id/login/callback"
  logoutCallbackPath?: string; // Path to the logout callback endpoint, defaults to "/id/logout/callback"
  logoutPath?: string; // Path to the logout endpoint, defaults to "/id/logout"
  cookieDomainURL?: URL; // Domain where cookies should be set. TODO: Should this be forced?
  locale?: string; // Locale to override the OIDC provider app default locale
  scopes?: string[]; // Scopes to request during login, defaults to ["openid", "profile", "email", "entitlements", "offline_access"]
  prompts?: string[]; // Custom prompts to add to the login request
  cookies?: {
    authParams: string,
    tokens: string,
    logout: string,
  }
};

type OidcWellKnownConfig = {
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

type TokenSet = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
};

type OidcConfig = {
  clientConfig: OidcClientConfig;
  wellKnownConfig: OidcWellKnownConfig;
  signingKeys: SigningKey[];
};

type OidcClient = {
  login: (req: ExpressRequest, res: Response, options?: LoginOptions) => void;
  loginCallback: (req: ExpressRequest, res: Response) => void;
  logout: (req: ExpressRequest, res: Response, options?: LogoutOptions) => void;
  logoutCallback: (req: ExpressRequest, res: Response) => void;
  refresh: (req: ExpressRequest, res: Response) => Promise<void>;
  config: OidcConfig;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  idTokenClaims?: Record<string, any>;
  isAuthenticated?: boolean;
};

declare module "express-serve-static-core" {
  interface Request {
    oidc: OidcClient
  }
}

export type {
  LoginOptions,
  LogoutOptions,
  OidcClient,
  OidcClientConfig,
  OidcConfig,
  OidcWellKnownConfig,
  TokenSet,
  VerifyOptions,
};
