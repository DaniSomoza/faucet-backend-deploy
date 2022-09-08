import dotenv from "dotenv";

import Server from "./src/server";
import registerRoutes from "./src/router/router";

dotenv.config();

const { SERVER_PORT, FRONTEND_ORGIN } = process.env;

const allowedOrigins = FRONTEND_ORGIN?.split(",");

const DEFAULT_SERVER_PORT = "3001";

const faucetServer = new Server();

faucetServer.configureCors(allowedOrigins);

registerRoutes(faucetServer);

faucetServer.start(SERVER_PORT || DEFAULT_SERVER_PORT);
