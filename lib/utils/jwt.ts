import jwt from "jsonwebtoken";
import type { SigningKey } from "jwks-rsa";

import type { VerifyOptions } from "../types";

function verifyJwt(token: string, signingKeys: SigningKey[], options: VerifyOptions): boolean {
  const publicKeys = signingKeys.map((key) => key.getPublicKey());

  for (const key of publicKeys) {
    try {
      jwt.verify(token, key as string, {
        algorithms: [ "RS256" ],
        issuer: options.issuer,
        audience: options.audience,
      });

      return true;
    } catch (error) {
      // Do nothing, continue to the next key
    }
  }

  return false;
  // throw new Error("Failed to verify ID token with any of the provided keys");
}

function decodeJwt(token: string, signingKeys: SigningKey[], options: VerifyOptions): any {
  const validJwt = verifyJwt(token, signingKeys, options);

  if (!validJwt) {
    return null;
  }

  return jwt.decode(token, { complete: true });
}

export { decodeJwt, verifyJwt };
