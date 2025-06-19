import { createOidcMiddleware } from "./lib/middleware";
import type { OidcClientConfig } from "./lib/types";

function auth(config: OidcClientConfig) {
  return createOidcMiddleware(config);
}

// TODO: Remove OidcClient export if not needed
export { auth, type OidcClientConfig };
