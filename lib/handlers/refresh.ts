import type { Request, Response } from "express";

import type { Context } from "../types";

function refresh({ clientConfig: _cc, wellKnownConfig: _wkc }: Context, _req: Request, _res: Response): void {
  return;
}

export { refresh };
