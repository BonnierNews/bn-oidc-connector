import { Request, Response, NextFunction } from "express";

async function queryParams(req: Request, res: Response, next: NextFunction) {
  const { idlogin, idrefresh, ...queryParameters } = req.query as Record<string, string>;

  if (idlogin) {
    const searchParams = new URLSearchParams(queryParameters);

    // TODO: Add support for login token
    res.oidc.login(req, res, {
      returnTo: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: idlogin === "silent" ? [ "none" ] : [],
    });

    return;
  }

  if (idrefresh) {
    try {
      await res.oidc.refresh(req, res);
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // TODO: Should this be handled or just continue?
    }

    next();

    return;
  }

  next();
}

export { queryParams };
