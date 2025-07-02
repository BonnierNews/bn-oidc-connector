import { SigningKey } from "jwks-rsa";

import { OidcWellKnownConfig } from "../types";

function tmp(wellKnownConfig: OidcWellKnownConfig, signingKeys: SigningKey[]) {
  const issuerBaseURL = "https://oidc.test";

  wellKnownConfig = {
    issuer: issuerBaseURL,
    authorization_endpoint: `${issuerBaseURL}/oauth/authorize`,
    token_endpoint: `${issuerBaseURL}/oauth/token`,
    userinfo_endpoint: `${issuerBaseURL}/oauth/userinfo`,
    jwks_uri: `${issuerBaseURL}/oauth/jwks`,
    end_session_endpoint: `${issuerBaseURL}/oauth/logout`,
    scopes_supported: [ "openid", "profile", "email", "entitlements", "externalIds", "offline_access" ],
    response_types_supported: [ "code" ],
    grant_types_supported: [ "authorization_code", "refresh_token" ],
    subject_types_supported: [ "public" ],
    id_token_signing_alg_values_supported: [ "HS256", "RS256" ],
    ui_locales_supported: [ "da-DK", "en-US", "fi-FI", "nl-NL", "nb-NO", "sv-SE" ],
  };

  signingKeys = [] as SigningKey[];
}

export { tmp };
