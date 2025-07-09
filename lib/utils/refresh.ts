import type { Request, Response } from "express";

import { RefreshRequestError } from "../errors";
import { setTokensCookie } from "./cookies";
import { verifyJwt } from "./jwt";
import { fetchTokensByRefreshToken } from "./tokens";

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

    const tokens = await fetchTokensByRefreshToken({
      tokenEndpoint: wellKnownConfig.token_endpoint,
      clientId: clientConfig.clientId,
      refreshToken,
    });

    const validJwt = verifyJwt(tokens.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });

    if (!validJwt) {
      throw new Error("Failed to verify ID token");
    }

    setTokensCookie(clientConfig, res, tokens);
  } catch (error) {
    throw new RefreshRequestError(`Failed to refresh tokens: ${(error as Error).message.toLowerCase()}`);
  }
}

export { refreshTokens };
