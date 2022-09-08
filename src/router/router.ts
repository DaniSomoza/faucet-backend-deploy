import Server from "src/server";

import faucetRouter from "../router/faucet-router";

function registerRoutes(server: Server) {
  server.registerRouter(faucetRouter);
}

export default registerRoutes;
