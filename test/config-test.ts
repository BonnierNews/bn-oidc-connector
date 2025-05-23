import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, "..", "config");

describe("config", () => {
  describe("files", () => {
    fs.readdirSync(configDir).forEach((file) => {
      if (!file.match(/\.json$/)) return;

      it(`${file} is valid JSON`, () => {
        JSON.parse(fs.readFileSync(path.join(configDir, file), "utf-8"));
      });
    });
  });
});
