import jwt from "jsonwebtoken";
import type { SigningKey } from "jwks-rsa";

import type { VerifyOptions } from "../types";

function verifyJwt(token: string, signingKeys: SigningKey[], options: VerifyOptions): any {
  const publicKeys = signingKeys.map((key) => key.getPublicKey());

  for (const key of publicKeys) {
    try {
      return jwt.verify(token, key as string, {
        algorithms: [ "RS256" ],
        issuer: options.issuer,
        audience: options.audience,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log("JWT verification failed: Token expired");
        throw error; // Re-throw to handle expired tokens specifically
      }
      console.log("JWT verification failed:", (error as Error).message, (error as Error).constructor);
    }
  }

  throw new Error("Failed to verify ID token with any of the provided keys");
}

export { verifyJwt };
