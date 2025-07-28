import type { NextFunction, Request, Response } from "express";

import { getTokensCookie } from "../utils/cookies";
import { isUserEntitled } from "../utils/claims";
import {
  loginCallback,
  logoutCallback,
  login,
  logout,
} from "../handlers";
import type { OidcConfig } from "../types";
import { refreshTokens } from "../utils/refresh";

function oidcContext(getConfig: () => OidcConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { clientConfig } = getConfig();
    const tokens = getTokensCookie(clientConfig, req);

    req.oidc = {
      config: getConfig(),
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      idToken: tokens?.idToken,
      expiresIn: tokens?.expiresIn,
      isAuthenticated: false,
      isEntitled: (request, validEntitlements) => isUserEntitled(request, validEntitlements),
    };

    res.oidc = {
      login: (request, response, options) => login(request, response, options),
      loginCallback: (request, response) => loginCallback(request, response, next),
      logout: (request, response, options) => logout(request, response, options),
      logoutCallback: (request, response) => logoutCallback(request, response),
      refresh: async (request, response) => await refreshTokens(request, response),
    };

    next();
  };
}

export { oidcContext };
