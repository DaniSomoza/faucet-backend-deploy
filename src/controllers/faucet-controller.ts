import { RequestType, ResponseType } from "src/server";
import faucetService from "../services/faucet-service";

const HTTP_ERROR_STATUS = 400;

async function faucetController(request: RequestType, response: ResponseType) {
  try {
    const faucetResponse = await faucetService.claimFunds(request.body);

    return response.send(faucetResponse);
  } catch (error: any) {
    response.status(HTTP_ERROR_STATUS);

    return response.send({
      error: error.message,
    });
  }
}

export default faucetController;
