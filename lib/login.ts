import crypto from "crypto";
import { type Response } from "express";

import { getClientConfig, getWellKnownConfig } from "./middleware";

/**
 * Function to generate a random code verifier.
 */
const generateCodeVerifier = () => {
  return crypto
    .randomBytes(32)
    .toString("base64url")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

/**
 * Function to generate a code challenge from the verifier.
 */
const generateCodeChallenge = (verifier: string) => {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

/**
 * Redirects the user to the OIDC provider for login with the necessary parameters.
 */
const login = (res: Response, returnUri: string) => {
  const clientConfig = getClientConfig();
  const wellKnownConfig = getWellKnownConfig();

  if (!clientConfig || !wellKnownConfig) {
    throw new Error("Middleware must be initialized before calling login");
  }

  const authorizationUrl = new URL(
    wellKnownConfig.authorization_endpoint, clientConfig.issuerBaseURL
  );

  const redirectUri = clientConfig.baseURL;
  redirectUri.pathname = clientConfig.callbackPath as string;
  redirectUri.searchParams.set("return-uri", returnUri);

  /** Generate random state and nonce values */
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

  authorizationUrl.searchParams.append("client_id", clientConfig.clientId);
  authorizationUrl.searchParams.append("response_type", "code");
  authorizationUrl.searchParams.append("scope", "openid profile email entitlements offline_access");
  authorizationUrl.searchParams.append("redirect_uri", redirectUri.toString());
  authorizationUrl.searchParams.append("state", state);
  authorizationUrl.searchParams.append("nonce", nonce);
  authorizationUrl.searchParams.append("code_challenge", codeChallenge);
  authorizationUrl.searchParams.append("code_challenge_method", "S256");

  res.redirect(authorizationUrl.toString());
};

export { login };
