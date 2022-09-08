import express from "express";

import faucetController from "../controllers/faucet-controller";

const FAUCET_PATHNAME = "/api/faucet";

const faucetRouter = express.Router();

// TODO: ADD GET Funds Claimed endpoint and add the next request time!

faucetRouter.post(FAUCET_PATHNAME, faucetController);

export default faucetRouter;
