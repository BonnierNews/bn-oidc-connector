import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import type { SigningKey } from "jwks-rsa";

type LoginOptions = {
  returnTo?: string;
  scopes?: string[];
  prompts?: string[];
  locale?: string;
  token?: string;
};

type VerifyOptions = {
  issuer: string;
  audience: string;
};

type LogoutOptions = {
  returnTo?: string;
};

type OidcClientConfig = {
  clientId: string;
  clientSecret?: string;
  issuerBaseURL: URL;
  baseURL: URL;
  loginPath: string; // Path to the login endpoint, defaults to "/id/login"
  loginCallbackPath: string; // Path to the login callback endpoint, defaults to "/id/login/callback"
  afterLoginCallback?: (req: ExpressRequest, res: ExpressResponse) => void; // Custom login callback handler
  logoutPath: string; // Path to the logout endpoint, defaults to "/id/logout"
  logoutCallbackPath: string; // Path to the logout callback endpoint, defaults to "/id/logout/callback"
  afterLogoutCallback?: (req: ExpressRequest, res: ExpressResponse) => void; // Custom logout callback handler
  cookieDomainURL?: URL; // Domain where cookies should be set. TODO: Should this be forced?
  locale?: string; // Locale to override the OIDC provider app default locale
  scopes: string[]; // Scopes to request during login, defaults to ["openid", "profile", "email", "entitlements", "offline_access"]
  prompts: string[]; // Custom prompts to add to the login request
  cookies: {
    authParams: string,
    tokens: {
      access: string,
      refresh: string,
      id: string,
      expiresIn: string,
    },
    logout: string,
  }
};

type AuthOptions = Partial<OidcClientConfig> & {
  clientId: string;
  issuerBaseURL: URL;
  baseURL: URL;
}

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

type OidcRequestContext = {
  config: OidcConfig;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  idTokenClaims?: Record<string, any>;
  isAuthenticated: boolean;
  isEntitled: (validEntitlements: string[]) => boolean;
  user?: Record<string, string | number | boolean>;
};

type OidcResponseContext = {
  login: (req: ExpressRequest, res: ExpressResponse, options?: LoginOptions) => void;
  loginCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  logout: (req: ExpressRequest, res: ExpressResponse, options?: LogoutOptions) => void;
  logoutCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  refresh: (req: ExpressRequest, res: ExpressResponse) => Promise<void>;
};

declare module "express-serve-static-core" {
  interface Request {
    oidc: OidcRequestContext;
  }
}

declare module "express-serve-static-core" {
  interface Response {
    oidc: OidcResponseContext;
  }
}

export type {
  AuthOptions,
  LoginOptions,
  LogoutOptions,
  OidcClientConfig,
  OidcConfig,
  OidcWellKnownConfig,
  OidcRequestContext,
  OidcResponseContext,
  TokenSet,
  VerifyOptions,
};
