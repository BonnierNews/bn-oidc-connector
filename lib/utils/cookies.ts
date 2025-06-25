import type { Request, Response } from "express";

import type { OidcClientConfig, TokenSet } from "../types";

function setAuthParamsCookie(
  { baseURL, cookieDomainURL, cookies }: OidcClientConfig,
  res: Response,
  authParams: {
    state: string;
    nonce?: string;
    codeVerifier?: string;
  }
): void {
  const cookieDomain = cookieDomainURL ?? baseURL;

  setCookie(res, cookies!.authParams, authParams, {
    domain: cookieDomain.hostname,
    secure: cookieDomain.protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
  });
}

function setTokensCookie(
  { baseURL, cookieDomainURL, cookies }: OidcClientConfig,
  res: Response,
  tokens: TokenSet
): void {
  const cookieDomain = cookieDomainURL ?? baseURL;

  setCookie(res, cookies!.tokens, tokens, {
    domain: cookieDomain.hostname,
    secure: cookieDomain.protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  });
}

function getTokensCookie(
  { cookies }: OidcClientConfig,
  req: Request
): TokenSet {
  return req.cookies[cookies!.tokens] || null;
}

function setCookie(
  res: Response,
  name: string,
  value: any,
  options: {
    domain: string;
    httpOnly?: boolean;
    secure?: boolean;
    expires: Date,
  }
): void {
  res.cookie(name, value, {
    domain: options.domain,
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? true,
    expires: options.expires,
  });
}

export {
  setAuthParamsCookie,
  setTokensCookie,
  getTokensCookie,
};
