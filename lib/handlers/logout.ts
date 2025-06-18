import type { Response } from "express";

import type { Context } from "../types";

function logout({ clientConfig: _cc, wellKnownConfig: _wkc }: Context, _res: Response): void {
  return;
}

export { logout };
