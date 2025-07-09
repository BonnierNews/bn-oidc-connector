import type { OidcWellKnownConfig, TokenSet } from "../types";
import { TokenRequestError } from "../errors";

export type FetchTokensByAuthorizationCodeOptions = {
  tokenEndpoint: OidcWellKnownConfig["token_endpoint"];
  clientId: string;
  code: string;
  redirectUri: URL;
  codeVerifier?: string; // Optional for PKCE
  clientSecret?: string;
};

export type FetchTokensByRefreshTokenOptions = {
  tokenEndpoint: string;
  clientId: string;
  refreshToken: string;
  clientSecret?: string;
};

type FetchTokenOptions = {
  grant_type: string;
  client_id: string;
  client_secret?: string;
  code?: string;
  refresh_token?: string;
  code_verifier?: string;
  redirect_uri?: string;
};

async function fetchTokensByAuthorizationCode(
  options: FetchTokensByAuthorizationCodeOptions
): Promise<TokenSet> {
  const params : FetchTokenOptions = {
    grant_type: "authorization_code",
    client_id: options.clientId,
    code: options.code,
    redirect_uri: options.redirectUri.toString(),
  };

  if (options.codeVerifier) {
    params.code_verifier = options.codeVerifier;
  }

  if (options.clientSecret) {
    params.client_secret = options.clientSecret;
  }

  return await fetchTokens(options.tokenEndpoint, params);
}

async function fetchTokensByRefreshToken(
  options: FetchTokensByRefreshTokenOptions
): Promise<TokenSet> {
  const params : FetchTokenOptions = {
    grant_type: "refresh_token",
    client_id: options.clientId,
    refresh_token: options.refreshToken,
  };

  if (options.clientSecret) {
    params.client_secret = options.clientSecret;
  }

  return await fetchTokens(options.tokenEndpoint, params);
}

async function fetchTokens(tokenEndpoint: string, params: FetchTokenOptions): Promise<TokenSet> {
  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      throw new Error(`ID service responded with ${response.status}`);
    }

    const tokens = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
    };
  } catch (error) {
    throw new TokenRequestError(`OIDC token request failed: ${(error as Error).message}`);
  }
}

export {
  fetchTokensByAuthorizationCode,
  fetchTokensByRefreshToken,
};
