import type { Request, Response } from "express";

import type { Context, TokenSet } from "../types";
import { setTokensCookie } from "../utils/cookies";
import { fetchTokensByAuthorizationCode } from "../utils/tokens";

async function callback({ clientConfig, wellKnownConfig }: Context, req: Request, res: Response): Promise<void> {
  if (!clientConfig || !wellKnownConfig) {
    throw new Error("Middleware must be initialized before calling callback");
  }

  const { state: incomingState, code } = req.query as { state: string; code: string };
  const { state: storedState, codeVerifier } = req.cookies.bnoidcauthparams ?? {};
  const returnUri = req.query["return-uri"] ?? "/";

  if (incomingState !== storedState) {
    res.status(400).send("Invalid state parameter");

    return;
  }

  const tokens: TokenSet = await fetchTokensByAuthorizationCode({
    tokenEndpoint: wellKnownConfig.token_endpoint,
    clientId: clientConfig.clientId,
    code,
    codeVerifier,
  });

  setTokensCookie(clientConfig, res, tokens);

  res.redirect(returnUri as string);
}

export { callback };
