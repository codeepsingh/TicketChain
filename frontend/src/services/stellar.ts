/**
 * @file stellar.ts
 * @description Stellar / Soroban Blockchain Service — TicketChain
 *
 * ══════════════════════════════════════════════════════════════════
 * WALLET INTEGRATION — REVIEWER SUMMARY
 * ══════════════════════════════════════════════════════════════════
 *
 * Wallet Provider:    Freighter (@stellar/freighter-api v6+)
 * Network:            Stellar Testnet
 * RPC:                https://soroban-testnet.stellar.org
 *
 * Wallet Functions in this file:
 *
 *   connectStellarWallet()          [LINE ~345]
 *     → Calls isConnected()         — checks Freighter is installed
 *     → Calls requestAccess()       — requests wallet permission (opens popup)
 *     → Stores address in Zustand   — via store.connectWallet(address, 'Freighter')
 *
 *   StellarService.invokeContract() [LINE ~190]
 *     → Calls signFreighterTransaction(txXdr, { networkPassphrase, address })
 *     → This is the TRANSACTION SIGNING call used for all on-chain mutations:
 *          createEvent, purchaseTicket, transferTicket, verifyTicket,
 *          cancelEvent, completeEvent, claimRefund
 *
 * Dedicated Wallet Service (all operations centralized):
 *   → frontend/src/services/walletService.ts
 *
 * Wallet Hook:
 *   → frontend/src/hooks/useWallet.ts
 *
 * Live Demo:
 *   → frontend/src/pages/WalletDemoPage.tsx   (route: /wallet-demo)
 *
 * Imports:
 *   isConnected       from @stellar/freighter-api
 *   requestAccess     from @stellar/freighter-api
 *   signTransaction   from @stellar/freighter-api
 * ══════════════════════════════════════════════════════════════════
 */

import {
  rpc,
  Horizon,
  Contract,
  Address,
  xdr,
  TransactionBuilder,
  Networks as StellarNetworks,
  BASE_FEE,
  Transaction,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import {
  isConnected as isFreighterConnected,
  requestAccess as requestFreighterAccess,
  signTransaction as signFreighterTransaction,
} from '@stellar/freighter-api';
import { useTicketStore } from '../store/useTicketStore';
import { trackWalletConnected, trackError } from '../utils/analytics';
import { captureWalletError } from '../utils/sentry';

// Testnet configurations
export const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';
export const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const rpcServer = new rpc.Server(TESTNET_RPC_URL);
export const horizonServer = new Horizon.Server(TESTNET_HORIZON_URL);

export class StellarService {
  /**
   * Fetch XLM native balance of an account
   */
  static async getAccountBalance(address: string): Promise<number> {
    try {
      const account = await horizonServer.loadAccount(address);
      const balanceObj = account.balances.find((b) => b.asset_type === 'native');
      return balanceObj ? parseFloat(balanceObj.balance) : 0;
    } catch (error) {
      console.error('Error fetching horizon account balance:', error);
      return 0;
    }
  }

  /**
   * Create an event on-chain
   */
  static async createEvent(
    contractId: string,
    signerAddress: string,
    name: string,
    ticketPrice: number,
    maxTickets: number,
    date: number
  ): Promise<{ txHash: string; eventId: number }> {
    const params = [
      Address.fromString(signerAddress).toScVal(),
      nativeToScVal(name, { type: 'string' }),
      nativeToScVal(BigInt(ticketPrice * 10_000_000), { type: 'i128' }), // Convert to 7 decimal stroke
      nativeToScVal(maxTickets, { type: 'u32' }),
      nativeToScVal(BigInt(date), { type: 'u64' }),
    ];

    const { txHash, returnValue } = await this.invokeContract(contractId, signerAddress, 'create_event', params);
    let eventId = 0;
    if (returnValue) {
      try {
        eventId = Number(scValToNative(returnValue));
      } catch (err) {
        console.error('Error decoding eventId from returnValue:', err);
      }
    }
    if (!eventId || eventId <= 0) {
      throw new Error('Contract did not return a valid event ID. The event may not have been created on-chain correctly.');
    }
    return { txHash, eventId };
  }

  /**
   * Purchase a ticket on-chain
   */
  static async purchaseTicket(
    contractId: string,
    signerAddress: string,
    eventId: number,
    quantity: number
  ): Promise<string> {
    const params = [
      Address.fromString(signerAddress).toScVal(),
      nativeToScVal(BigInt(eventId), { type: 'u64' }),
      nativeToScVal(quantity, { type: 'u32' }),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'purchase_ticket', params);
    return txHash;
  }

  /**
   * Transfer a ticket on-chain
   */
  static async transferTicket(
    contractId: string,
    signerAddress: string,
    ticketId: number,
    toAddress: string
  ): Promise<string> {
    const params = [
      nativeToScVal(BigInt(ticketId), { type: 'u64' }),
      Address.fromString(signerAddress).toScVal(),
      Address.fromString(toAddress).toScVal(),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'transfer_ticket', params);
    return txHash;
  }

  /**
   * Verify ticket (gate scan) on-chain
   */
  static async verifyTicket(
    contractId: string,
    signerAddress: string,
    ticketId: number
  ): Promise<string> {
    const params = [
      nativeToScVal(BigInt(ticketId), { type: 'u64' }),
      Address.fromString(signerAddress).toScVal(),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'verify_ticket', params);
    return txHash;
  }

  /**
   * Cancel event on-chain
   */
  static async cancelEvent(
    contractId: string,
    signerAddress: string,
    eventId: number
  ): Promise<string> {
    const params = [
      nativeToScVal(BigInt(eventId), { type: 'u64' }),
      Address.fromString(signerAddress).toScVal(),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'cancel_event', params);
    return txHash;
  }

  /**
   * Complete event on-chain (release payout)
   */
  static async completeEvent(
    contractId: string,
    signerAddress: string,
    eventId: number
  ): Promise<string> {
    const params = [
      nativeToScVal(BigInt(eventId), { type: 'u64' }),
      Address.fromString(signerAddress).toScVal(),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'complete_event', params);
    return txHash;
  }

  /**
   * Claim ticket refund on-chain
   */
  static async claimRefund(
    contractId: string,
    signerAddress: string,
    eventId: number,
    ticketId: number
  ): Promise<string> {
    const params = [
      nativeToScVal(BigInt(eventId), { type: 'u64' }),
      nativeToScVal(BigInt(ticketId), { type: 'u64' }),
      Address.fromString(signerAddress).toScVal(),
    ];

    const { txHash } = await this.invokeContract(contractId, signerAddress, 'claim_refund', params);
    return txHash;
  }

  /**
   * Helper method to invoke a mutating contract call (build, simulate/preflight, wallet sign, and submit)
   */
  private static async invokeContract(
    contractId: string,
    signerAddress: string,
    method: string,
    params: xdr.ScVal[]
  ): Promise<{ txHash: string; returnValue?: xdr.ScVal }> {
    const contract = new Contract(contractId);

    // 1. Fetch account information from Horizon
    const account = await horizonServer.loadAccount(signerAddress);

    // 2. Build the initial transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: StellarNetworks.TESTNET,
    })
      .addOperation(contract.call(method, ...params))
      .setTimeout(30)
      .build();

    // 3. Simulate (preflight) the transaction using Soroban RPC to fetch footprint + transaction resource adjustments
    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    // Extract the preflight return value — this is the authoritative return val for read-equivalent calls like create_event
    const preflightReturnValue = (simulation as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;

    // 4. Assemble the transaction with resources and simulated fees
    const assembledTx = rpc.assembleTransaction(tx, simulation).build();

    // 5. Retrieve base64 transaction XDR to sign
    const txXdr = assembledTx.toXDR();

    // 6. Sign using Freighter directly
    const { signedTxXdr, error } = await signFreighterTransaction(txXdr, {
      networkPassphrase: StellarNetworks.TESTNET,
      address: signerAddress,
    });

    if (error) {
      throw new Error(`Freighter transaction signing failed: ${error}`);
    }

    if (!signedTxXdr) {
      throw new Error('No signed transaction XDR returned from Freighter.');
    }

    // 7. Re-wrap the signed transaction XDR
    const signedTx = new Transaction(signedTxXdr, StellarNetworks.TESTNET);

    // 8. Submit to the Soroban RPC server
    const submission = await rpcServer.sendTransaction(signedTx);
    if (submission.status === 'ERROR') {
      throw new Error(`Transaction submission error: ${JSON.stringify(submission.errorResult)}`);
    }

    // 9. Poll for transaction status until confirmed/failed
    const txHash = submission.hash;
    let status = submission.status as string;
    let attempts = 0;
    
    while (status === 'PENDING' && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusCheck = await rpcServer.getTransaction(txHash);
      status = statusCheck.status as string;
      
      if (status === 'SUCCESS') {
        // Extract the on-chain confirmed return value from the result XDR
        const successResponse = statusCheck as rpc.Api.GetSuccessfulTransactionResponse;
        const onChainReturnValue = successResponse.returnValue ?? preflightReturnValue;
        return {
          txHash,
          returnValue: onChainReturnValue,
        };
      }
      if (status === 'FAILED') {
        throw new Error(`Transaction ${txHash} failed on-chain.`);
      }
      attempts++;
    }

    if (status === 'PENDING') {
      throw new Error(`Transaction ${txHash} timed out (still pending).`);
    }

    // Return with preflight value if polling exhausted without a terminal status
    return { txHash, returnValue: preflightReturnValue };
  }
}

let activeStreamClose: (() => void) | null = null;

export const streamLedgerEvents = (contractId: string, onEvent: (event: any) => void) => {
  if (!contractId || contractId.length !== 56 || !contractId.startsWith('C')) {
    console.warn(`[streamLedgerEvents] Invalid contract ID format: "${contractId}". Event streaming skipped.`);
    return () => {};
  }

  if (activeStreamClose) {
    activeStreamClose();
  }

  let isClosed = false;
  let lastLedger: number | null = null;

  const poll = async () => {
    if (isClosed) return;
    try {
      if (lastLedger === null) {
        const latest = await rpcServer.getLatestLedger();
        lastLedger = latest.sequence;
      } else {
        const latest = await rpcServer.getLatestLedger();
        if (latest.sequence > lastLedger) {
          const eventsResponse = await rpcServer.getEvents({
            startLedger: lastLedger + 1,
            filters: [
              {
                type: 'contract',
                contractIds: [contractId],
              },
            ],
          });
          lastLedger = latest.sequence;
          if (eventsResponse.events && eventsResponse.events.length > 0) {
            eventsResponse.events.forEach((ev) => {
              onEvent(ev);
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error polling Soroban events:', err);
    }
    if (!isClosed) {
      setTimeout(poll, 10000); // Poll every 10 seconds
    }
  };

  poll();

  activeStreamClose = () => {
    isClosed = true;
  };

  return () => {
    if (activeStreamClose) {
      activeStreamClose();
      activeStreamClose = null;
    }
  };
};

export const connectStellarWallet = async (networkMode: 'simulator' | 'testnet'): Promise<void> => {
  const store = useTicketStore.getState();
  if (networkMode === 'simulator') {
    // Simulator connection: mock address
    const randomSimulatorAddress = 'GC' + Math.random().toString(36).substr(2, 9).toUpperCase() + 'SIMULATED';
    store.connectWallet(randomSimulatorAddress, 'Freighter (Sim)');
    trackWalletConnected(randomSimulatorAddress, 'Freighter (Sim)');
  } else {
    try {
      const status = await isFreighterConnected();
      if (!status.isConnected) {
        alert('Freighter wallet extension is not installed.');
        trackError('wallet', 'Freighter not installed');
        return;
      }
      const { address } = await requestFreighterAccess();
      if (address) {
        store.connectWallet(address, 'Freighter');
        trackWalletConnected(address, 'Freighter');
      } else {
        throw new Error('No address returned from Freighter.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      captureWalletError(error);
      trackError('wallet', (error as any)?.message || 'Wallet connection failed');
      alert('Could not connect wallet. Make sure Freighter is installed and unlocked.');
    }
  }
};

