import { Request, Response, NextFunction } from "express";

async function queryParams(req: Request, res: Response, next: NextFunction) {
  if (!req.oidc || !req.oidc.context) {
    next(new Error("OIDC context is not initialized"));

    return;
  }

  const { idlogin, idrefresh, ...queryParameters } = req.query as Record<string, string>;

  if (idlogin) {
    const searchParams = new URLSearchParams(queryParameters);

    req.oidc.login(res, {
      returnUri: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: idlogin === "silent" ? [ "none" ] : [],
    });

    return;
  }

  if (idrefresh && req.oidc) {
    await req.oidc.refresh(req, res);

    next();

    return;
  }

  next();
}

export { queryParams };
