import express, { Application, Router, Request, Response } from "express";
import cors from "cors";

import logger, { log } from "./logger/logger";

export type RequestType = Request;
export type ResponseType = Response;

class Server {
  app: Application;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(logger);
  }

  start(serverPort: string) {
    this.app.listen(serverPort, () => {
      log.info(`Server running on port: ${serverPort}`);
    });
  }

  registerRouter(router: Router) {
    this.app.use(router);
  }

  configureCors(origins?: string[]) {
    this.app.options("*", cors<Request>());
    this.app.post(
      "*",
      cors<Request>({
        origin: origins,
      })
    );
  }
}

export default Server;
