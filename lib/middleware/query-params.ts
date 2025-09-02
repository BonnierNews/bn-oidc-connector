import { Request, Response, NextFunction } from "express";

async function queryParams(req: Request, res: Response, next: NextFunction) {
  const { idlogin, idrefresh, migrationToken, loginToken, ...queryParameters } = req.query as Record<string, string>;

  if (idlogin) {
    const searchParams = new URLSearchParams(queryParameters);

    res.oidc.login(req, res, {
      returnPath: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: idlogin === "silent" ? [ "none" ] : [],
      token: loginToken || migrationToken,
    });

    return;
  }

  if (loginToken || migrationToken) {
    const searchParams = new URLSearchParams(queryParameters);

    res.oidc.login(req, res, {
      returnPath: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: [],
      token: loginToken || migrationToken,
    });

    return;
  }

  if (idrefresh) {
    try {
      await res.oidc.refresh(req, res);
    } catch (error) {
      // TODO: Should this be handled or just continue?
    }

    next();

    return;
  }

  next();
}

export { queryParams };
