import type { Request, Response, NextFunction } from "express";

async function queryParams(req: Request, res: Response, next: NextFunction) {
  const { idlogin, idrefresh, idlogintoken, idbypasscache, ...queryParameters } = req.query as Record<string, string>;

  if (idlogintoken) {
    const searchParams = new URLSearchParams(queryParameters);

    res.oidc.login(req, res, {
      returnTo: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: [],
      token: idlogintoken,
    });

    return;
  }

  if (idlogin) {
    const searchParams = new URLSearchParams(queryParameters);

    res.oidc.login(req, res, {
      returnTo: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: idlogin === "silent" ? [ "none" ] : [],
    });

    return;
  }

  if (idrefresh) {
    try {
      await res.oidc.refresh(req, res, { bypassCache: idbypasscache === "true" });
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // TODO: Should this be handled or just continue?
    }

    next();

    return;
  }

  next();
}

export { queryParams };
