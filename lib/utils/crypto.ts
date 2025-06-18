import { randomBytes, createHash } from "crypto";

function generateState(length = 16): string {
  return randomBytes(length).toString("hex");
}

function generateNonce(length = 16): string {
  return randomBytes(length).toString("hex");
}

function generateCodeVerifier(length = 32): string {
  return randomBytes(length).toString("base64url");
}

function generateCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export {
  generateState,
  generateNonce,
  generateCodeVerifier,
  generateCodeChallenge,
};
