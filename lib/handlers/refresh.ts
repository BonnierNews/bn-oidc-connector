import type { Request, Response } from "express";

import type { Context, TokenSet } from "../types";
import { setTokensCookie } from "../utils/cookies";
import { fetchTokensByRefreshToken } from "../utils/tokens";

async function refresh({ clientConfig, wellKnownConfig }: Context, req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies[clientConfig.cookies!.tokens]?.refresh_token;

  if (!refreshToken) {
    throw new Error("No refresh token found in cookies");
  }

  const tokens: TokenSet = await fetchTokensByRefreshToken({
    tokenEndpoint: wellKnownConfig.token_endpoint,
    clientId: clientConfig.clientId,
    refreshToken,
  });

  setTokensCookie(clientConfig, res, tokens);
}

export { refresh };
