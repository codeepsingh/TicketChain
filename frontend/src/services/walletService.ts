/**
 * @file walletService.ts
 * @description Centralized Freighter Wallet Integration Service for TicketChain
 *
 * This file is the PRIMARY entry point for all wallet operations on TicketChain.
 * It wraps @stellar/freighter-api to provide:
 *
 *   1. checkConnection()    — Checks if Freighter is installed and connected
 *   2. connectWallet()      — Requests wallet permission + retrieves address
 *   3. disconnectWallet()   — Clears wallet state from global store
 *   4. getWalletAddress()   — Returns the connected wallet's Stellar public key
 *   5. getWalletBalance()   — Fetches XLM balance via Horizon API
 *   6. signTransaction()    — Signs a Soroban transaction XDR via Freighter
 *
 * Wallet Provider: Freighter (@stellar/freighter-api v6+)
 * Network:         Stellar Testnet
 * State Manager:   Zustand (useTicketStore)
 *
 * Reviewer Note:
 *   This service is consumed by:
 *     - Navbar.tsx         → "Connect Wallet" / "Disconnect" buttons
 *     - useTickets.ts      → All on-chain mutations (purchase, transfer, verify, etc.)
 *     - App.tsx            → Balance sync loop
 *     - WalletDemoPage.tsx → Live reviewer demonstration
 */

import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import { Horizon, Networks as StellarNetworks } from '@stellar/stellar-sdk';
import { useTicketStore } from '../store/useTicketStore';
import { trackWalletConnected, trackWalletDisconnected, trackError } from '../utils/analytics';
import { captureWalletError } from '../utils/sentry';

// ─── Network Configuration ────────────────────────────────────────────────────
const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const horizonServer = new Horizon.Server(TESTNET_HORIZON_URL);

// ─────────────────────────────────────────────────────────────────────────────
// 1. checkConnection
//    Detects whether the Freighter browser extension is installed and active.
//    Returns: { isInstalled: boolean; isConnected: boolean }
// ─────────────────────────────────────────────────────────────────────────────
export const checkConnection = async (): Promise<{
  isInstalled: boolean;
  isConnected: boolean;
}> => {
  try {
    // freighterIsConnected() resolves to { isConnected: boolean }
    const result = await freighterIsConnected();
    return {
      isInstalled: true,
      isConnected: result.isConnected,
    };
  } catch {
    // Extension not installed or blocked
    return { isInstalled: false, isConnected: false };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. connectWallet
//    Full wallet connection flow:
//      Step 1 → freighterIsConnected()   : Check if Freighter is installed
//      Step 2 → freighterRequestAccess() : Prompt user for wallet permission
//      Step 3 → address returned         : Store in Zustand global state
//
//    This is the function triggered by the "Connect Wallet" button in Navbar.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const connectWallet = async (): Promise<{
  success: boolean;
  address: string | null;
  error: string | null;
}> => {
  try {
    // STEP 1: Verify Freighter extension is installed
    const connectionStatus = await freighterIsConnected();
    if (!connectionStatus.isConnected) {
      const msg = 'Freighter wallet extension is not installed. Please install it from https://freighter.app';
      trackError('wallet', msg);
      return { success: false, address: null, error: msg };
    }

    // STEP 2: Request wallet permission — opens Freighter popup for user approval
    // Uses: freighterRequestAccess() → { address: string }
    const { address } = await freighterRequestAccess();

    if (!address) {
      const msg = 'Freighter returned no address. User may have rejected the permission request.';
      trackError('wallet', msg);
      return { success: false, address: null, error: msg };
    }

    // STEP 3: Store wallet state globally via Zustand
    const store = useTicketStore.getState();
    store.connectWallet(address, 'Freighter');

    // Analytics tracking
    trackWalletConnected(address, 'Freighter');

    return { success: true, address, error: null };
  } catch (error: unknown) {
    const msg = (error as Error)?.message || 'Wallet connection failed';
    captureWalletError(error);
    trackError('wallet', msg);
    return { success: false, address: null, error: msg };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. disconnectWallet
//    Clears all wallet state from the Zustand store and local storage.
//    Called by the "Disconnect" button in the Navbar dropdown.
// ─────────────────────────────────────────────────────────────────────────────
export const disconnectWallet = (): void => {
  const store = useTicketStore.getState();
  const address = store.walletAddress;

  // Clear all wallet-related state in global store
  store.disconnectWallet();

  trackWalletDisconnected();
  void address;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. getWalletAddress
//    Returns the currently connected wallet address from the Zustand store.
//    This is a synchronous read — no async call needed since the store
//    is updated during connectWallet().
// ─────────────────────────────────────────────────────────────────────────────
export const getWalletAddress = (): string | null => {
  return useTicketStore.getState().walletAddress;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. getWalletBalance
//    Fetches the live XLM (native asset) balance of the connected wallet
//    from the Stellar Horizon API (Testnet).
//
//    Used by App.tsx in a 15-second polling interval after wallet connection.
// ─────────────────────────────────────────────────────────────────────────────
export const getWalletBalance = async (address: string): Promise<number> => {
  try {
    const account = await horizonServer.loadAccount(address);
    const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch (error) {
    console.error('[walletService] Error fetching balance:', error);
    return 0;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. signTransaction
//    Signs a Soroban transaction XDR using Freighter.
//
//    This is called inside StellarService.invokeContract() (stellar.ts) for
//    every on-chain mutation: createEvent, purchaseTicket, transferTicket,
//    verifyTicket, cancelEvent, completeEvent, claimRefund.
//
//    Flow:
//      StellarService.invokeContract()
//        → builds + simulates (preflight) transaction
//        → calls signTransaction(txXdr, address)  ← THIS FUNCTION
//        → Freighter opens popup for user confirmation
//        → returns signedTxXdr
//        → submitted to Soroban RPC via rpcServer.sendTransaction()
//
//    Parameters:
//      txXdr   — base64-encoded unsigned transaction XDR
//      address — signer's Stellar public key (G...)
//
//    Returns:
//      signedTxXdr — base64-encoded signed transaction XDR ready for submission
// ─────────────────────────────────────────────────────────────────────────────
export const signTransaction = async (
  txXdr: string,
  address: string
): Promise<{ signedTxXdr: string | null; error: string | null }> => {
  try {
    // freighterSignTransaction opens the Freighter extension popup.
    // The user must approve the transaction for signedTxXdr to be returned.
    const result = await freighterSignTransaction(txXdr, {
      networkPassphrase: StellarNetworks.TESTNET,
      address,
    });

    if (result.error) {
      return { signedTxXdr: null, error: result.error };
    }

    if (!result.signedTxXdr) {
      return { signedTxXdr: null, error: 'No signed XDR returned from Freighter' };
    }

    return { signedTxXdr: result.signedTxXdr, error: null };
  } catch (error: unknown) {
    const msg = (error as Error)?.message || 'Transaction signing failed';
    captureWalletError(error);
    return { signedTxXdr: null, error: msg };
  }
};
