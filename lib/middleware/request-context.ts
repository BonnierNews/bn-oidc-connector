import type { NextFunction, Request, Response } from "express";

import { getTokensCookie } from "../utils/cookies";
import {
  loginCallback,
  logoutCallback,
  login,
  logout,
} from "../handlers";
import type { OidcConfig } from "../types";
import { refreshTokens } from "../utils/refresh";

function requestContext(getConfig: () => OidcConfig) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { clientConfig } = getConfig();
    const tokens = getTokensCookie(clientConfig, req);

    // TODO: Set the oidc object in the response object instead
    req.oidc = {
      login: (request, response, options) => login(request, response, options),
      loginCallback: (request, response) => loginCallback(request, response, next),
      logout: (request, response, options) => logout(request, response, options),
      logoutCallback: (request, response) => logoutCallback(request, response),
      refresh: async (request, response) => await refreshTokens(request, response),
      config: getConfig(),
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      idToken: tokens?.idToken,
      expiresIn: tokens?.expiresIn,
      isAuthenticated: false,
    };

    next();
  };
}

export { requestContext };
