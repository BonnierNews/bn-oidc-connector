import { createOidcMiddleware } from "./lib/middleware";
import type { OidcClientConfig } from "./lib/types";

function auth(config: OidcClientConfig) {
  return createOidcMiddleware(config);
}

export { auth, type OidcClientConfig };
