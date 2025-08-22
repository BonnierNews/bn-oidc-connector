import type { Request, Response } from "express";

import { getLogoutCookie, unsetLogoutCookie } from "../utils/cookies";

function logoutCallback(
  req: Request,
  res: Response
): void {
  const { clientConfig } = req.oidc.config;
  const { state: incomingState } = req.query as { state: string };
  const storedState = getLogoutCookie(clientConfig, req);

  unsetLogoutCookie(clientConfig, res);

  let returnPath = req.query["return-path"] ?? "/";

  if (incomingState && incomingState !== storedState?.state) {
    returnPath = "/";
    res.redirect(returnPath as string);
  }

  if (clientConfig.customPostLogoutCallback) {
    clientConfig.customPostLogoutCallback(req, res);
  }

  res.redirect(returnPath as string);
}

export { logoutCallback };
