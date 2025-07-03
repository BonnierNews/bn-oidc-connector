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

// const payload = {
//   iss: config.selfUrl,
//   sub: subject,
//   aud: clientId,
//   exp: Math.floor(Date.now() / 1000) + config.oidc.accessToken.ttl,
//   iat: Math.floor(Date.now() / 1000),
//   ...claims,
// };
//
// if (nonce) {
//   payload.nonce = nonce;
// }
//
// if (authenticationTokenSelector) {
//   payload.sid = authenticationTokenSelector;
// }
//
// const algorithm = getClientSigningAlgorithm(clientId);
// const secretOrPrivateKey = getClientSecretOrPrivateKey(clientId);
//
// return jwt.sign(payload, secretOrPrivateKey, { algorithm });

export { generateIdToken };
