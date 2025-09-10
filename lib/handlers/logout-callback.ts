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

  let returnTo: string = req.query["return-to"] as string ?? "/";

  if (incomingState && incomingState !== storedState?.state) {
    returnTo = "/";

    res.redirect(returnTo);

    return;
  }

  if (clientConfig.afterLogoutCallback) {
    clientConfig.afterLogoutCallback(req, res);
  }

  res.redirect(returnTo);
}

export { logoutCallback };
