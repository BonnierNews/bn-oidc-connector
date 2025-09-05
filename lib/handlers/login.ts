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

  const scopes = options.scopes ?? [ ...(new Set([ "openid", ...clientConfig.scopes ])) ];
  const prompts = options.prompts ?? clientConfig.prompts;

  const redirectUri = new URL(clientConfig.baseURL.toString());
  redirectUri.pathname = `${redirectUri.pathname.replace(/\/$/, "")}${clientConfig.loginCallbackPath}`;
  redirectUri.searchParams.set("return-to", options.returnTo ?? clientConfig.baseURL.pathname);

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

  if (options.locale) {
    params.set("ui_locales", options.locale);
  }

  if (options.token) {
    params.set("token", options.token);
  }

  const authorizationUrl = new URL(wellKnownConfig.authorization_endpoint);
  authorizationUrl.search = params.toString();

  res.redirect(authorizationUrl.toString());
}

export { login };
