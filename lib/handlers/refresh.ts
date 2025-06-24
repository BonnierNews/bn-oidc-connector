import type { Request, Response } from "express";

import type { Context } from "../types";

async function refresh({ clientConfig, wellKnownConfig }: Context, req: Request, _res: Response): void {

  const refreshToken = req.cookies[clientConfig.cookies.tokens]?.refresh_token;

  if (!refreshToken) {
    throw new Error("No refresh token found in cookies");
  }

  const tokenResponse = await fetch(wellKnownConfig.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientConfig.clientId,
      refresh_token: refreshToken,
    }).toString(),
  });

  const tokens = JSON.parse(await tokenResponse.text());

  res.cookie(clientConfig.cookies.tokens, tokens, {
    domain: clientConfig.cookieDomain?.hostname ?? req.hostname,
    httpOnly: true,
    secure: new URL(clientConfig.baseURL).protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  });
}

export { refresh };
