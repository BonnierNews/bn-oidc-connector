import type { Response, Request } from "express";

import type { Context, LogoutOptions } from "../types";

function logout(
  { clientConfig, wellKnownConfig }: Context,
  req: Request,
  res: Response,
  options: LogoutOptions = {}
): void {

  const redirectUri = new URL(clientConfig.baseURL.toString());
  redirectUri.pathname = clientConfig.logoutCallbackPath as string;
  redirectUri.searchParams.set("return-uri", options.returnUri ?? "/");

  const tokensCookie - getTokensCookie(clientConfig, req);
  const params = new URLSearchParams({
    client_id: clientConfig.clientId,
    post_logout_redirect_uri: redirectUri.toString(),
    id_token_hint: TODO GET COOKIE
    state: TODO
  });

  if (prompts.length > 0) {
    params.set("prompt", prompts.join(" "));
  }

  const authorizationUrl = new URL(wellKnownConfig.authorization_endpoint);
  authorizationUrl.search = params.toString();

  return res.redirect("/");
}

export { logout };
