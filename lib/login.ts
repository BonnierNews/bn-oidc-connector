import crypto from "crypto";
import { type Response } from "express";

import { getClientConfig, getWellKnownConfig } from "./middleware";

type LoginOptions = {
  returnUri: string;
  scopes?: Array<string>;
  prompts?: Array<string>;
};

// Function to generate a random code verifier
const generateCodeVerifier = () => {
  return crypto
    .randomBytes(32)
    .toString("base64url")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// Function to generate a code challenge from the verifier
const generateCodeChallenge = (verifier: string) => {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// Login handler
const handleLogin = (res: Response, options: LoginOptions) => {
  const clientConfig = getClientConfig();
  const wellKnownConfig = getWellKnownConfig();

  if (!clientConfig || !wellKnownConfig) {
    throw new Error("Middleware must be initialized before calling login");
  }

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
  redirectUri.searchParams.set("return-uri", options.returnUri);

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  res.cookie("bnoidcauthparams", { nonce, state, codeVerifier }, {
    domain: clientConfig.cookieDomain?.hostname ?? clientConfig.baseURL.hostname,
    httpOnly: true,
    secure: clientConfig.baseURL.protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
  });

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
};

export { handleLogin };
