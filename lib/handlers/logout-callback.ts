import type { Request, Response } from "express";

function logoutCallback(req: Request, res: Response): void {
  const returnUri = req.query["return-uri"] ?? "/";
  res.redirect(returnUri as string);
}

export { logoutCallback };
