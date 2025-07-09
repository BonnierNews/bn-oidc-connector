import type { OidcWellKnownConfig, TokenSet } from "../types";
import { TokenRequestError } from "../errors";

type FetchTokensByAuthorizationCodeOptions = {
  tokenEndpoint: OidcWellKnownConfig["token_endpoint"];
  clientId: string;
  code: string;
  codeVerifier?: string; // Optional for PKCE
};

type FetchTokensByRefreshTokenOptions = {
  tokenEndpoint: string;
  clientId: string;
  refreshToken: string;
};

async function fetchTokensByAuthorizationCode(
  options: FetchTokensByAuthorizationCodeOptions
): Promise<TokenSet> {
  const params = {
    grant_type: "authorization_code",
    client_id: options.clientId,
    code: options.code,
    code_verifier: options.codeVerifier,
  };

  if (options.codeVerifier) {
    params.code_verifier = options.codeVerifier;
  }

  return await fetchTokens(options.tokenEndpoint, params);
}

async function fetchTokensByRefreshToken(
  options: FetchTokensByRefreshTokenOptions
): Promise<TokenSet> {
  return await fetchTokens(options.tokenEndpoint, {
    grant_type: "refresh_token",
    client_id: options.clientId,
    refresh_token: options.refreshToken,
  });
}

async function fetchTokens(tokenEndpoint: string, params: {
  grant_type: string;
  client_id: string;
  code?: string;
  refresh_token?: string;
}): Promise<TokenSet> {
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
