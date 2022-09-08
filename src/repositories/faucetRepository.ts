import { TransactionResponse } from "@ethersproject/providers";
import dotenv from "dotenv";
import { ethers } from "ethers";

import { log } from "../logger/logger";

dotenv.config();

const {
  FAUCET_CONTRACT_ADDRESS_RINKEBY,
  FAUCET_CONTRACT_ADDRESS_GNOSIS_CHAIN,
  FAUCET_CONTRACT_ADDRESS_GOERLI,
  INFURA_TOKEN,
  PRIVATE_KEY,
} = process.env;

async function claimFunds(
  address: string,
  chainId: number
): Promise<{ transaction: string }> {
  try {
    const transaction = await enqueueClaimsTransactions(() => {
      const faucetContract = getFaucetContract(chainId);

      return faucetContract.claimFunds(address);
    }, address);

    return {
      transaction: transaction?.hash || "",
    };
  } catch (error: any) {
    const errorLabel = error?.error?.reason || error?.error || error;
    throw new Error(errorLabel);
  }
}

const faucetRepository = { claimFunds };

export default faucetRepository;

// cache with all chain Contract instances
const contracts: Record<number, ethers.Contract> = {};

/**
 * Returns the Faucet contract instance in the given chain
 *
 * @param {number} chainId The faucet contract chainId.
 * @return {ethers.Contract} The Faucet contract.
 */
const getFaucetContract = (chainId: number): ethers.Contract => {
  contracts[chainId] = contracts[chainId] || initializeFaucetContract(chainId);

  return contracts[chainId];
};

/**
 * Initialize the Faucet contract instance in the given chain
 *
 * @param {number} chainId The faucet contract chainId.
 * @return {ethers.Contract} The Faucet contract initialized.
 */
const initializeFaucetContract = (chainId: number): ethers.Contract => {
  const chain = chains.find((chain) => Number(chain.id) === chainId);

  const provider = new ethers.providers.JsonRpcProvider(chain?.rpcUrl);

  const wallet = new ethers.Wallet(PRIVATE_KEY as string, provider);

  const faucetAddress = faucetAddresses[chainId];

  if (!faucetAddress) {
    throw new Error("Validation Error: Faucet address not found");
  }

  const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, wallet);

  return faucetContract;
};

const faucetAbi = ["function claimFunds(address userAddress)"];

const rinkebyChainId = 4;
const goerliChainId = 5;
const gnosisChainId = 100;

const faucetAddresses: Record<number, string | undefined> = {
  [rinkebyChainId]: FAUCET_CONTRACT_ADDRESS_RINKEBY,
  [gnosisChainId]: FAUCET_CONTRACT_ADDRESS_GNOSIS_CHAIN,
  [goerliChainId]: FAUCET_CONTRACT_ADDRESS_GOERLI,
};

const rinkebyChain: Chain = {
  id: rinkebyChainId,
  rpcUrl: `https://rinkeby.infura.io/v3/${INFURA_TOKEN}`,
};

const gnosisChain: Chain = {
  id: gnosisChainId,
  rpcUrl: "https://rpc.gnosischain.com",
};

const goerliChain: Chain = {
  id: goerliChainId,
  rpcUrl: `https://goerli.infura.io/v3/${INFURA_TOKEN}`,
};

const chains = [rinkebyChain, gnosisChain, goerliChain];

type Chain = {
  id: number;
  rpcUrl: string;
};

type ClaimFn = () => Promise<TransactionResponse>;

const transactionQueue: Promise<TransactionResponse>[] = [];

/**
 * Enqueues all Claim transactions and execute them sequentially to avoid nonce collisions
 *
 * @param {ClaimFn} claim The claim callback
 * @param {string} address the claim address
 * @return {Promise<TransactionResponse>} the claim transaction response
 */
async function enqueueClaimsTransactions(
  claim: ClaimFn,
  address: string
): Promise<TransactionResponse> {
  // we add the Claim wrapperd in a promise in the queue without execute it
  const myPosition = transactionQueue.length;
  let executeClaim = () => {};
  const pendingClaim = new Promise<TransactionResponse>((resolve, reject) => {
    executeClaim = async () => {
      try {
        const transaction = await claim();
        resolve(transaction);
      } catch (e) {
        reject(e);
      } finally {
        log.info(`[FINISHED] [#${myPosition}] claim(${address})`);
      }
    };
  });

  transactionQueue.push(pendingClaim);

  log.info(`[QUEUED] [#${myPosition}] claim(${address})`);

  try {
    // we wait for the previous claim
    const previousTransaction = await transactionQueue[myPosition - 1];

    // we need to wait for the previous claim transaction to perform the new one to make sure that we use a new nonce
    if (previousTransaction?.hash) {
      await previousTransaction.wait();
    }
  } catch (error) {
    // nothing to do here
  } finally {
    log.info(`[STARTED] [#${myPosition}] claim(${address})`);

    // after the execution of the previous claim, we can execute our current claim
    executeClaim();

    return transactionQueue[myPosition];
  }
}
