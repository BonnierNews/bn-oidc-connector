import { createOidcMiddleware } from "./lib/middleware";
import type { ClientConfig } from "./lib/types";

function auth(config: ClientConfig) {
  return createOidcMiddleware(config);
}

export { auth, type ClientConfig };
