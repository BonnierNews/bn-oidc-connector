import type { Request, Response } from "express";

import { RefreshRequestError } from "../errors";
import { setTokenCookies } from "./cookies";
import { verifyJwt } from "./jwt";
import { fetchTokensByRefreshToken, FetchTokensByRefreshTokenOptions } from "./tokens";

async function refreshTokens(
  req: Request,
  res: Response
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

    const tokens = await fetchTokensByRefreshToken(params);

    const validJwt = verifyJwt(tokens.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });

    if (!validJwt) {
      throw new Error("Failed to verify ID token");
    }

    setTokenCookies(clientConfig, res, tokens);

    // Update the request context with new tokens
    req.oidc.accessToken = tokens.accessToken;
    req.oidc.refreshToken = tokens.refreshToken;
    req.oidc.idToken = tokens.idToken;
    req.oidc.expiresIn = tokens.expiresIn;
  } catch (error) {
    throw new RefreshRequestError(`Failed to refresh tokens: ${(error as Error).message.toLowerCase()}`);
  }
}

export { refreshTokens };
