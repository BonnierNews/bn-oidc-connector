import { fileURLToPath } from "url";
import fs from "fs";

import { logger } from "./lib/logger";
import { setupApp } from "./lib/init/setup-app";

const app = setupApp();

export { app }; // Expose app to tests

function main() {
  const port = Number(process.env.PORT) || 3000;
  const packageInfo = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  app.listen(port, () => {
    logger.info("%s listening on port %d", packageInfo.name, port);
  });
}

// Only listen if started, not if included
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
