import { createOidcMiddleware } from "./lib/middleware";
import type { LoginOptions, OidcClientConfig } from "./lib/types";

function auth(config: OidcClientConfig) {
  return createOidcMiddleware(config);
}

// TODO: Remove OidcClient export if not needed
export { auth, type LoginOptions, type OidcClientConfig };
