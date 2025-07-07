import { Request, Response, NextFunction } from "express";

async function queryParams(req: Request, res: Response, next: NextFunction) {
  const { idlogin, idrefresh, ...queryParameters } = req.query as Record<string, string>;

  if (idlogin) {
    const searchParams = new URLSearchParams(queryParameters);

    // TODO: Add support for login token
    req.oidc.login(req, res, {
      returnUri: searchParams.size > 0 ? `${req.path}?${searchParams}` : req.path,
      prompts: idlogin === "silent" ? [ "none" ] : [],
    });

    return;
  }

  if (idrefresh) {
    try {
      await req.oidc.refresh(req, res);
    } catch (error) {
      // TODO: Should this be handled or just continue?
    }

    next();

    return;
  }

  next();
}

export { queryParams };
