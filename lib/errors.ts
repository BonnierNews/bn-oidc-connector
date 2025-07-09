/* eslint-disable @bonniernews/typescript-rules/disallow-class-extends */
export class OidcError extends Error {}
export class UnauthorizedError extends OidcError {}
export class UnauthenticatedError extends OidcError {}
export class InvalidStateError extends OidcError {}
export class InvalidIdTokenError extends OidcError {}
export class RefreshRequestError extends OidcError {}
export class TokenRequestError extends OidcError {}
export class InitOidcError extends OidcError {}
export class DiscoveryFailedError extends OidcError {}
