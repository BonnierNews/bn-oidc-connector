import { Request, Response, NextFunction } from "express";

import { getTokensCookie } from "../utils/cookies";
import {
  loginCallback,
  logoutCallback,
  login,
  logout,
  refresh,
} from "../handlers";
import { type Context, OidcClient } from "../types";

function requestContext(getContext: () => Context) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { clientConfig } = getContext();
    const tokens = getTokensCookie(clientConfig, req);

    req.oidc = {
      login: (response, options) => login(getContext(), response as Response, options),
      loginCallback: (request, response) => loginCallback(getContext(), request as Request, response as Response),
      logoutCallback: (request, response) => logoutCallback(getContext(), request as Request, response as Response),
      refresh: async (request, response) => await refresh(getContext(), request as Request, response as Response),
      logout: (request, response, options) => logout(getContext(), request as Request, response as Response, options),
      context: getContext(),
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      idToken: tokens?.idToken,
      expiresIn: tokens?.expiresIn,
      isAuthenticated: false,
    } as OidcClient;

    next();
  };
}

export { requestContext };
