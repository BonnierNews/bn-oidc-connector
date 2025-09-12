import bnConfig from "@bonniernews/eslint-config";

export default [
  ...bnConfig,
  {
    name: "bn-oidc-connector/ignores",
    ignores: [
      "tmp /",
      "public /",
      "coverage /",
      "app / assets / js / vendor/**",
      "submodule/**",
      "logs/",
      "docs/",
      "dist/",
    ],
  },
];
