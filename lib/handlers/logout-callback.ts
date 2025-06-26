import type { Request, Response } from "express";

import type { Context } from "../types";
import { getLogoutCookie, unsetLogoutCookie } from "../utils/cookies";

function logoutCallback(
  { clientConfig }: Context,
  req: Request,
  res: Response
): void {
  const { state: incomingState } = req.query as { state: string };
  const storedState = getLogoutCookie(clientConfig, req);

  unsetLogoutCookie(clientConfig, res);

  let returnUri = req.query["return-uri"] ?? "/";

  if (incomingState && incomingState !== storedState?.state) {
    returnUri = "/";
  }

  res.redirect(returnUri as string);
}

export { logoutCallback };
