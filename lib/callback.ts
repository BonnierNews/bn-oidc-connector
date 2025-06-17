import { type Request, type Response } from "express";

import { getClientConfig, getWellKnownConfig } from "./middleware";

// Callback handler
const handleCallback = async (req: Request, res: Response): Promise<void> => {
  const clientConfig = getClientConfig();
  const wellKnownConfig = getWellKnownConfig();

  if (!clientConfig || !wellKnownConfig) {
    throw new Error("Middleware must be initialized before calling callback");
  }

  const { state: incomingState, code } = req.query as { state: string; code: string };
  const { state: storedState, codeVerifier } = req.cookies.bnoidcauthparams ?? {};
  const returnUri = req.query["return-uri"] ?? "/";

  if (incomingState !== storedState) {
    res.status(400).send("Invalid state parameter");

    return;
  }

  const tokenResponse = await fetch(wellKnownConfig.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientConfig.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${clientConfig.baseURL}${clientConfig.callbackPath}`,
      code_verifier: codeVerifier,
    }),
  });

  const tokens = JSON.parse(await tokenResponse.text());

  res.cookie("bnoidctokens", tokens, {
    domain: clientConfig.cookieDomain?.hostname ?? req.hostname,
    httpOnly: true,
    secure: new URL(clientConfig.baseURL).protocol === "https:",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  });

  res.redirect(returnUri as string);
};

export { handleCallback };
