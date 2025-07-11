import { readFileSync } from "fs";
import jwt, { type SignOptions } from "jsonwebtoken";

function generateIdToken(
  payload: Record<string, any> = {},
  options?: SignOptions
) {
  const privateKey: string = readFileSync("test/helpers/private.pem", "utf8");

  return jwt.sign(
    payload,
    privateKey,
    {
      issuer: "https://oidc.test",
      audience: "test-client-id",
      subject: "1234567890",
      expiresIn: "10m",
      ...options,
    } as SignOptions
  );
}

export { generateIdToken };
