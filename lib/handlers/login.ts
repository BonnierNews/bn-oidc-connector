import { type Response } from "express";

import type { AuthorizationUrlOptions, Context, LoginOptions } from "../types";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateNonce,
  generateState,
} from "../utils/crypto";

const generateAuthorizationUrl = (options: AuthorizationUrlOptions): URL => {
  const params = new URLSearchParams({
    client_id: options.clientId,
    response_type: "code",
    scope: options.scopes.join(" "),
    redirect_uri: options.redirectUri.toString(),
    state: options.state,
    nonce: options.nonce,
    code_challenge: options.codeChallenge,
    code_challenge_method: options.codeChallengeMethod,
  });

  if (options.prompts.length > 0) {
    params.set("prompt", options.prompts.join(" "));
  }

  const authorizationUrl = new URL(options.authorizationEndpoint);
  authorizationUrl.search = params.toString();

  return authorizationUrl;
};

function login(
  { clientConfig, wellKnownConfig }: Context,
  res: Response,
  options: LoginOptions = {}
): void {
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
  redirectUri.pathname = clientConfig.callbackPath as string;
  redirectUri.searchParams.set("return-uri", options.returnUri ?? "/");

  const state = generateState();
  const nonce = generateNonce();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  res.cookie("bnoidcauthparams", { nonce, state, codeVerifier }, {
    domain: clientConfig.cookieDomain?.hostname ?? clientConfig.baseURL.hostname,
    httpOnly: true,
    secure: clientConfig.baseURL.protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
  });

  const authorizationUrl = generateAuthorizationUrl({
    clientId: clientConfig.clientId,
    authorizationEndpoint: wellKnownConfig.authorization_endpoint,
    scopes,
    redirectUri,
    state,
    nonce,
    codeChallenge,
    codeChallengeMethod: "S256",
    prompts,
  });

  res.redirect(authorizationUrl.toString());
}

export { login, generateAuthorizationUrl };
