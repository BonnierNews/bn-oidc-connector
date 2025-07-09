# Bonnier OIDC Connector

## Description

Express middleware for connection to Bonnier News OpenID Connect Provider

```sh
npm install @bonniernews/bn-oidc-connector
```

## Usage

```js
import { auth } from "@bonniernews/bn-oidc-connector";
import express from "express";

const app = express();
const oidcConfig = {
  clientId: YOUR_CLIENT_ID,
  issuerBaseURL: new URL("https://bn-login-id-service-lab.bnu.bn.nr"),
  baseURL: new URL(YOUR_APPS_BASE_URL),
  scopes: [
    "profile",
    "email",
    "entitlements",
    "offline_access"
  ]
}

app.use(auth(oidcConfig));
```

The `middleware` should be put as early as possible, since only registers routes that will determine if user need to refresh.
