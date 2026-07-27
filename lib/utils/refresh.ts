import type { Request, Response } from "express";

import { RefreshRequestError } from "../errors";
import type { RefreshOptions } from "../types";
import { attachUserToContext } from "./claims";
import { setTokenCookies } from "./cookies";
import { decodeJwt } from "./jwt";
import { fetchTokensByRefreshToken, type FetchTokensByRefreshTokenOptions } from "./tokens";

async function refreshTokens(
  req: Request,
  res: Response,
  options?: RefreshOptions
): Promise<void> {
  const { clientConfig, wellKnownConfig, signingKeys } = req.oidc.config;

  try {
    const { refreshToken } = req.oidc;

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const params: FetchTokensByRefreshTokenOptions = {
      tokenEndpoint: wellKnownConfig.token_endpoint,
      clientId: clientConfig.clientId,
      refreshToken,
    };

    if (clientConfig.clientSecret) {
      params.clientSecret = clientConfig.clientSecret;
    }

    if (options?.bypassCache) {
      params.bypassCache = true;
    }

    const tokens = await fetchTokensByRefreshToken(params);

    const decodedJwt = decodeJwt(tokens.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });

    if (!decodedJwt) {
      throw new Error("Failed to verify ID token");
    }

    setTokenCookies(clientConfig, res, tokens);

    // Update the request context with new tokens and their claims, so the
    // request that triggered the refresh already sees the refreshed identity
    req.oidc.accessToken = tokens.accessToken;
    req.oidc.refreshToken = tokens.refreshToken;
    req.oidc.idToken = tokens.idToken;
    req.oidc.expiresIn = tokens.expiresIn;
    req.oidc.idTokenClaims = decodedJwt;
    attachUserToContext(req, decodedJwt);
  } catch (error) {
    throw new RefreshRequestError(`Failed to refresh tokens: ${(error as Error).message.toLowerCase()}`);
  }
}

export { refreshTokens };
