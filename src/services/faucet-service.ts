import { isAddress } from "ethers/lib/utils";

import faucetRepository from "../repositories/faucetRepository";

type faucetParamsType = {
  address: string;
  chainId: string;
};

type faucetReturnType = Promise<{
  transaction: string;
}>;

// TODO: add a logger lib (pine)

async function claimFunds(faucetRequest: faucetParamsType): faucetReturnType {
  if (!isAddress(faucetRequest.address) || !faucetRequest.address) {
    throw new Error("Validation Error: Address not valid");
  }

  if (isNaN(Number(faucetRequest.chainId)) || !faucetRequest.chainId) {
    throw new Error("Validation Error: ChainId not valid");
  }

  try {
    const { transaction } = await faucetRepository.claimFunds(
      faucetRequest.address,
      Number(faucetRequest.chainId)
    );

    return {
      transaction,
    };
  } catch (error) {
    throw error;
  }
}

const faucetService = {
  claimFunds,
};

export default faucetService;
