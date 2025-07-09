import type { NextFunction, Request, Response } from "express";

import type { TokenSet } from "../types";
import { InvalidStateError, InvalidIdTokenError } from "../errors";
import { setTokensCookie, unsetAuthParamsCookie } from "../utils/cookies";
import { verifyJwt } from "../utils/jwt";
import { fetchTokensByAuthorizationCode, FetchTokensByAuthorizationCodeOptions } from "../utils/tokens";

async function loginCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { clientConfig, wellKnownConfig, signingKeys } = req.oidc.config;
  const { state: incomingState, code } = req.query as { state: string; code: string };
  const { state: storedState, codeVerifier } = req.cookies.bnoidcauthparams ?? {};
  const returnPath: string = req.query["return-path"] as string ?? "/";

  try {
    if (incomingState !== storedState) {
      throw new InvalidStateError("Invalid state parameter");
    }

    const redirectUri = new URL(clientConfig.baseURL.toString());
    redirectUri.pathname = clientConfig.loginCallbackPath;
    redirectUri.searchParams.set("return-path", returnPath);

    const params : FetchTokensByAuthorizationCodeOptions = {
      tokenEndpoint: wellKnownConfig.token_endpoint,
      clientId: clientConfig.clientId,
      code,
      redirectUri,
    };

    if (clientConfig.clientSecret) {
      params.clientSecret = clientConfig.clientSecret;
    }
    if (codeVerifier) {
      params.codeVerifier = codeVerifier;
    }

    const tokens: TokenSet = await fetchTokensByAuthorizationCode(params);

    const validJwt = verifyJwt(tokens.idToken, signingKeys, {
      issuer: wellKnownConfig.issuer,
      audience: clientConfig.clientId,
    });

    if (!validJwt) {
      throw new InvalidIdTokenError("Failed to verify ID token");
    }

    setTokensCookie(clientConfig, res, tokens);
  } catch (error) {
    next(error);

    return;
  } finally {
    unsetAuthParamsCookie(clientConfig, res);
  }

  res.redirect(returnPath as string);
}

export { loginCallback };
