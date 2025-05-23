# Node Starter App for TypeScript

## Description

Express middleware for connection to Bonnier News OpenID Connect Provider

```sh
npm install @bonniernews/bn-oidc-connector
```

## Usage

```js
import {
  middleware as oidcMiddleware
} from "@bonniernews/bn-oidc-connector";
import express from "express";

const app = express();
const oidcConfig = {
  client_id: "something secret"
}
app.use(oidcMiddleware(oidcConfig));

app.get("/", async (req, res) => {
  logger.info("Hello, world!");

  // Propagate traceparent to other services
  const response = await fetch("https://some.other.service.bn.nr/some/endpoint");
  ...
});
```

The `middleware` should be put as early as possible, since only registers routes that will determine if user need to refresh...

### Config

Example of `config` object
