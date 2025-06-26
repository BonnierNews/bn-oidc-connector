import type { Request, Response } from "express";

import type { Context, TokenSet } from "../types";
import { setTokensCookie, unsetAuthParamsCookie } from "../utils/cookies";
import { fetchTokensByAuthorizationCode } from "../utils/tokens";

async function loginCallback({ clientConfig, wellKnownConfig }: Context, req: Request, res: Response): Promise<void> {
  const { state: incomingState, code } = req.query as { state: string; code: string };
  const { state: storedState, codeVerifier } = req.cookies.bnoidcauthparams ?? {};
  const returnUri = req.query["return-uri"] ?? "/";

  if (incomingState !== storedState) {
    res.status(400).send("Invalid state parameter");
    // TODO: throw error

    return;
  }

  const tokens: TokenSet = await fetchTokensByAuthorizationCode({
    tokenEndpoint: wellKnownConfig.token_endpoint,
    clientId: clientConfig.clientId,
    code,
    codeVerifier,
  });

  setTokensCookie(clientConfig, res, tokens);
  unsetAuthParamsCookie(clientConfig, res);
  res.redirect(returnUri as string);
}

export { loginCallback };
