import type { Response, Request } from "express";

import type { LogoutOptions } from "../types";
import {
  getTokensCookie,
  setLogoutCookie,
  unsetAuthParamsCookie,
  unsetTokensCookie,
} from "../utils/cookies";
import { generateState } from "../utils/crypto";

function logout(
  req: Request,
  res: Response,
  options: LogoutOptions = {}
): void {
  const { clientConfig, wellKnownConfig } = req.oidc.config;
  const redirectUri = new URL(clientConfig.baseURL.toString());
  redirectUri.pathname = `${redirectUri.pathname.replace(/\/$/, "")}${clientConfig.loginCallbackPath}`;
  redirectUri.searchParams.set("return-path", options.returnPath ?? clientConfig.baseURL.pathname);

  const tokenSet = getTokensCookie(clientConfig, req);
  const state = generateState();

  const params = new URLSearchParams({
    client_id: clientConfig.clientId,
    post_logout_redirect_uri: redirectUri.toString(),
    state,
  });

  if (tokenSet?.idToken) {
    params.set("id_token_hint", tokenSet.idToken);
  }

  setLogoutCookie(clientConfig, res, { state });

  unsetAuthParamsCookie(clientConfig, res);
  unsetTokensCookie(clientConfig, res);

  const authorizationUrl = new URL(wellKnownConfig.end_session_endpoint);
  authorizationUrl.search = params.toString();

  return res.redirect(authorizationUrl.toString());
}

export { logout };
