import { Express, Request, Response } from "express";

export function routes(app: Express) {
  app.get("/", (_req: Request, res: Response) => {
    res.send(
      "<html><body style='background: red'><h1 style='color: white'>Hello from node starterapp</h1></body></html>"
    );
  });
}
