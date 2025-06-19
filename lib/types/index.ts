import { Request as ExpressRequest, Response } from "express";

type LoginOptions = {
  returnUri?: string;
  scopes?: string[];
  prompts?: string[];
};

type OidcClient = {
  login: (res: Response, options?: LoginOptions) => void;
  callback: (req: ExpressRequest, res: Response) => void;
  refresh: (req: ExpressRequest, res: Response) => void;
  logout: (res: Response) => void;
};

type OidcClientConfig = {
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

type Context = {
  clientConfig: OidcClientConfig;
  wellKnownConfig: OidcWellKnownConfig;
};

declare module "express" {
  interface Request {
    oidc?: OidcClient
  }
}

export type {
  Context,
  LoginOptions,
  OidcClient,
  OidcClientConfig,
  OidcWellKnownConfig,
};
