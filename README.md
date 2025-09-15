# Bonnier News OIDC Connector

Express middleware for connecting to the Bonnier News OpenID Connect Provider, providing authentication and authorization functionality for Node.js applications.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Middleware](#middleware)
- [Request Context](#request-context)
- [Response Context](#response-context)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)

## Installation

```bash
npm install @bonniernews/bn-oidc-connector
```

## Quick Start

```typescript
import { auth, isAuthenticated, isEntitled } from "@bonniernews/bn-oidc-connector";
import express from "express";

const app = express();

// Initialize OIDC middleware
app.use(auth({
  clientId: "your-client-id",
  issuerBaseURL: new URL("https://bn-login-id-service-lab.bnu.bn.nr"),
  baseURL: new URL("https://your-app-domain.com"),
  scopes: ["profile", "email", "entitlements", "offline_access"]
}));

// Protected route requiring authentication
app.get("/profile", isAuthenticated, (req, res) => {
  res.json({ user: req.oidc.user });
});

// Protected route requiring specific entitlements
app.get("/admin", isEntitled([ "admin" ]), (req, res) => {
  res.json({ message: "Admin area" });
});

app.listen(3000);
```

## Configuration

### AuthOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `clientId` | `string` | ✅ | - | Your OIDC client ID |
| `clientSecret` | `string` | ❌ | - | Your OIDC client secret (for confidential clients) |
| `issuerBaseURL` | `URL` | ✅ | - | Base URL of the OIDC provider |
| `baseURL` | `URL` | ✅ | - | Base URL of your application |
| `loginPath` | `string` | ❌ | `"/id/login"` | Path for login endpoint |
| `logoutPath` | `string` | ❌ | `"/id/logout"` | Path for logout endpoint |
| `loginCallbackPath` | `string` | ❌ | `"/id/login/callback"` | Path for login callback endpoint |
| `logoutCallbackPath` | `string` | ❌ | `"/id/logout/callback"` | Path for logout callback endpoint |
| `scopes` | `string[]` | ❌ | `["openid", "entitlements", "offline_access"]` | OAuth scopes to request |
| `prompts` | `string[]` | ❌ | `[]` | Custom prompts for the authorization request |
| `afterLoginCallback` | `function` | ❌ | - | Custom handler after successful login |
| `afterLogoutCallback` | `function` | ❌ | - | Custom handler after successful logout |
| `cookies` | `object` | ❌ | See below | Cookie configuration |

### Cookie Configuration

The connector uses several cookies to manage authentication state and tokens. The default cookie names are:

```typescript
cookies: {
  authParams: "bnoidcap",   // Cookie name for auth parameters
  tokens: {
    access: "bnoidcat",     // Cookie name for access token
    refresh: "bnoidcrt",    // Cookie name for refresh token
    id: "bnoidcit",         // Cookie name for ID token
    expiresIn: "bnoidcei"   // Cookie name for token expiry
  },
  logout: "bnoidclo"        // Cookie name for logout state
}
```

## Middleware

The library provides several middleware functions for different authentication and authorization scenarios.

### Core Middleware

#### `auth(options: AuthOptions)`

The main middleware that initializes the OIDC connector and sets up authentication routes. It should be registered as early as possible in your Express app.

```typescript
import { auth } from "@bonniernews/bn-oidc-connector";

app.use(auth({
  clientId: "your-client-id",
  issuerBaseURL: new URL("https://bn-login-id-service-lab.bnu.bn.nr"),
  baseURL: new URL("https://your-app.com")
}));
```

**Features:**
- Initializes OIDC configuration and JWKS
- Sets up authentication routes
- Adds OIDC context to request/response objects
- Handles automatic token refresh
- Processes query parameters for authentication flows

**Routes Created:**
- `GET /id/login` - Initiates login flow
- `GET /id/logout` - Initiates logout flow
- `GET /id/login/callback` - Handles login callback
- `GET /id/logout/callback` - Handles logout callback

### Guard Middleware

The library provides two guard middleware functions for protecting routes:

#### `isAuthenticated`

Ensures the user is authenticated before accessing a route.

```typescript
import { isAuthenticated } from "@bonniernews/bn-oidc-connector";

app.get("/protected", isAuthenticated, (req, res) => {
  // User is guaranteed to be authenticated
  res.json({ message: "Hello authenticated user!" });
});
```

**Behavior:**
- Checks `req.oidc.isAuthenticated`
- Throws `UnauthenticatedError` if user is not authenticated
- Allows request to continue if user is authenticated

**Use when:** You only need to verify that the user is logged in, without checking specific permissions.

#### `isEntitled(validEntitlements: string[])`

Checks if the authenticated user has specific entitlements. **Note: This middleware automatically checks for authentication first, so `isAuthenticated` is not needed when using `isEntitled`.**

```typescript
import { isEntitled } from "@bonniernews/bn-oidc-connector";

app.get("/admin", isEntitled(["admin", "super-user"]), (req, res) => {
  // User is guaranteed to be authenticated AND have at least one of the specified entitlements
  res.json({ message: "Admin access granted" });
});
```

**Parameters:**
- `validEntitlements`: Array of entitlement strings. User needs at least one.

**Behavior:**
- First checks if user is authenticated (throws `UnauthenticatedError` if not)
- Returns `true` if `validEntitlements` is empty
- Checks user's entitlements from ID token claims (`ent` field)
- Throws `UnauthorizedError` if user lacks required entitlements

**Use when:** You need to verify both authentication and specific permissions/roles.

#### When to Use Which Middleware

```typescript
// ✅ Use isAuthenticated for routes that only require login
app.get("/profile", isAuthenticated, (req, res) => { ... });

// ✅ Use isEntitled for routes that require specific permissions
app.get("/admin", isEntitled(["admin"]), (req, res) => { ... });

// ❌ Don't combine them - isEntitled already checks authentication
app.get("/admin", isAuthenticated, isEntitled(["admin"]), (req, res) => { ... });

// ✅ Use isAuthenticated when doing manual entitlement checks
app.get("/dynamic", isAuthenticated, (req, res) => {
  const hasAccess = req.oidc.isEntitled(["premium"]);
  // ... conditional logic
});
```

## Request Context

The middleware adds an `oidc` property to the Express `Request` object with the following structure:

### `req.oidc: OidcRequestContext`

| Property | Type | Description |
|----------|------|-------------|
| `config` | `OidcConfig` | Complete OIDC configuration including client config, well-known config, and signing keys |
| `accessToken` | `string \| undefined` | Current access token |
| `refreshToken` | `string \| undefined` | Current refresh token |
| `idToken` | `string \| undefined` | Current ID token (JWT) |
| `expiresIn` | `number \| undefined` | Token expiration time in seconds |
| `idTokenClaims` | `Record<string, any> \| undefined` | Decoded ID token claims |
| `isAuthenticated` | `boolean` | Whether the user is currently authenticated |
| `user` | `object \| undefined` | User information extracted from ID token |
| `isEntitled` | `function` | Function to check user entitlements |

### User Object

```typescript
req.oidc.user: {
  id: string;        // User ID (from 'sub' claim)
  email?: string;    // User email (if available in token)
}
```

### isEntitled Function

```typescript
req.oidc.isEntitled(validEntitlements: string[]): boolean
```

Check if the current user has any of the specified entitlements.

**Example:**
```typescript
app.get("/content", isAuthenticated, (req, res) => {
  if (req.oidc.isEntitled(["premium", "subscriber"])) {
    res.json({ content: "Premium content" });
  } else {
    res.json({ content: "Free content" });
  }
});
```

## Response Context

The middleware adds an `oidc` property to the Express `Response` object with authentication flow methods:

### `res.oidc: OidcResponseContext`

| Method | Signature | Description |
|--------|-----------|-------------|
| `login` | `(req, res, options?) => void` | Initiates login flow |
| `loginCallback` | `(req, res) => void` | Handles login callback |
| `logout` | `(req, res, options?) => void` | Initiates logout flow |
| `logoutCallback` | `(req, res) => void` | Handles logout callback |
| `refresh` | `(req, res) => Promise<void>` | Refreshes tokens |

### Login Options

```typescript
type LoginOptions = {
  returnTo?: string;     // URL to redirect after login
  scopes?: string[];     // Additional scopes to request
  prompts?: string[];    // OIDC prompts (e.g., "none", "login", "consent")
  locale?: string;       // UI locale for the login page
}
```

### Logout Options

```typescript
type LogoutOptions = {
  returnTo?: string;     // URL to redirect after logout
}
```

### Manual Authentication Flow

```typescript
app.get("/custom-login", (req, res) => {
  res.oidc.login(req, res, {
    returnTo: "/dashboard",
    scopes: ["profile", "email"],
    locale: "sv-SE"
  });
});

app.get("/custom-logout", (req, res) => {
  res.oidc.logout(req, res, {
    returnTo: "/goodbye"
  });
});
```

## API Reference

### Query Parameters

The middleware automatically handles special query parameters:

#### `idlogin`

Triggers automatic login flow:

```
GET /some-page?idlogin=true
GET /some-page?idlogin=silent  // Uses prompt=none for silent authentication
```

#### `idrefresh`

Triggers token refresh:

```
GET /some-page?idrefresh=true
```

This is useful in scenarios where claims or entitlements may have changed during the user's session—such as after a purchase, subscription upgrade, or profile update—allowing the application to refresh tokens and retrieve updated user information without requiring the user to log in again.

### Authentication Flow

1. **Login**: User visits `/id/login` or a page with `?idlogin=true`
2. **Authorization**: User is redirected to OIDC provider
3. **Callback**: Provider redirects to `/id/login/callback` with authorization code
4. **Token Exchange**: Authorization code is exchanged for tokens
5. **Session**: Tokens are stored in secure cookies
6. **Access**: User can access protected resources

### Token Management

- **Access tokens** are used for API authentication
- **Refresh tokens** are used to obtain new access tokens
- **ID tokens** contain user identity information
- Tokens are automatically refreshed when they expire
- Failed refresh attempts trigger re-authentication

## Error Handling

The library defines several error types for different failure scenarios:

### Error Types

| Error | Description |
|-------|-------------|
| `UnauthenticatedError` | User is not logged in |
| `UnauthorizedError` | User lacks required permissions |
| `InvalidStateError` | OAuth state parameter mismatch |
| `InvalidIdTokenError` | ID token validation failed |
| `RefreshRequestError` | Token refresh failed |
| `TokenRequestError` | Token exchange failed |
| `InitOidcError` | OIDC initialization failed |
| `DiscoveryFailedError` | OIDC discovery endpoint failed |

### Error Handling Example

```typescript
import { UnauthenticatedError, UnauthorizedError } from "@bonniernews/bn-oidc-connector";

app.use((err, req, res, next) => {
  if (err instanceof UnauthenticatedError) {
    return res.status(401).json({ error: "Please log in" });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Handle other errors
  next(err);
});
```

---

For more information and updates, visit the [GitHub repository](https://github.com/BonnierNews/bn-oidc-connector).
