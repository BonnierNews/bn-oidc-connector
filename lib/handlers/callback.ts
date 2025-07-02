import type { Request, Response } from "express";

import type { Context, TokenSet } from "../types";
import { setTokensCookie } from "../utils/cookies";
import { verifyJwt } from "../utils/jwt";
import { fetchTokensByAuthorizationCode } from "../utils/tokens";

async function callback(
  { clientConfig, wellKnownConfig, signingKeys }: Context,
  req: Request,
  res: Response
): Promise<void> {
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

  try {
    verifyJwt(tokens.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });
  } catch (error) {
    throw new Error(`Failed to verify ID token: ${(error as Error).message}`);
  }

  setTokensCookie(clientConfig, res, tokens);

  res.redirect(returnUri as string);
}

export { callback };
