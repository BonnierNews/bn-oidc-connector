import type { Request, Response } from "express";

import type { LoginOptions } from "../types";
import { setAuthParamsCookie } from "../utils/cookies";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateNonce,
  generateState,
} from "../utils/crypto";

function login(
  req: Request,
  res: Response,
  options: LoginOptions = {}
): void {
  const { clientConfig, wellKnownConfig } = req.oidc.config;
  const scopes = Array.from(new Set([
    "openid",
    ...(clientConfig.scopes ?? []),
    ...(options.scopes ?? []),
  ]));
  const prompts = Array.from(new Set([
    ...(clientConfig.prompts ?? []),
    ...(options.prompts ?? []),
  ]));

  const redirectUri = new URL(clientConfig.baseURL.toString());
  redirectUri.pathname = clientConfig.loginCallbackPath;
  redirectUri.searchParams.set("return-path", options.returnPath ?? "/");

  const state = generateState();
  const nonce = generateNonce();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  setAuthParamsCookie(clientConfig, res, { state, nonce, codeVerifier });

  const params = new URLSearchParams({
    client_id: clientConfig.clientId,
    response_type: "code",
    scope: scopes.join(" "),
    redirect_uri: redirectUri.toString(),
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  if (prompts.length > 0) {
    params.set("prompt", prompts.join(" "));
  }

  const authorizationUrl = new URL(wellKnownConfig.authorization_endpoint);
  authorizationUrl.search = params.toString();

  res.redirect(authorizationUrl.toString());
}

export { login };
