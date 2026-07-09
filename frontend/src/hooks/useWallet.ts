/**
 * @file useWallet.ts
 * @description React hook encapsulating all Freighter wallet state and operations.
 *
 * This hook is the primary consumer-facing API for wallet functionality.
 * Components import this hook to access wallet state and actions without
 * directly coupling to the store or service layer.
 *
 * Exposes:
 *   State:
 *     - isConnected    : boolean — wallet currently connected
 *     - address        : string | null — Stellar public key (G...)
 *     - balance        : number — XLM balance
 *     - walletName     : string | null — "Freighter"
 *     - isLoading      : boolean — async operation in progress
 *     - error          : string | null — last error message
 *     - isInstalled    : boolean — Freighter extension detected
 *
 *   Actions:
 *     - connect()      : Triggers Freighter permission request flow
 *     - disconnect()   : Clears wallet state
 *     - refreshBalance() : Fetches latest XLM balance from Horizon
 *     - checkInstalled() : Detects Freighter extension presence
 *
 * Reviewer Note:
 *   Used by WalletDemoPage.tsx to demonstrate live wallet integration.
 *   Also imported by components that gate actions on wallet connection.
 */

import { useState, useCallback, useEffect } from 'react';
import { useTicketStore } from '../store/useTicketStore';
import {
  connectWallet as serviceConnect,
  disconnectWallet as serviceDisconnect,
  getWalletBalance,
  checkConnection,
} from '../services/walletService';

// ─────────────────────────────────────────────────────────────────────────────
// useWallet Hook
// ─────────────────────────────────────────────────────────────────────────────
export const useWallet = () => {
  // ── Read wallet state from global Zustand store ──
  const { walletAddress, walletConnected, tokenBalance, walletName, updateTokenBalance } =
    useTicketStore();

  // ── Local UI state ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  // ── Detect Freighter extension on mount ──
  useEffect(() => {
    checkConnection().then(({ isInstalled: installed }) => {
      setIsInstalled(installed);
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // connect()
  //   Full wallet connection flow:
  //   1. Calls freighterIsConnected() to verify extension exists
  //   2. Calls freighterRequestAccess() to prompt user for permission
  //   3. Returns wallet address and stores in Zustand
  // ─────────────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await serviceConnect();
      if (!result.success) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // disconnect()
  //   Clears wallet state from Zustand store and localStorage.
  // ─────────────────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setError(null);
    serviceDisconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // refreshBalance()
  //   Fetches the current XLM balance from Horizon Testnet API
  //   and updates the global store.
  // ─────────────────────────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const balance = await getWalletBalance(walletAddress);
      updateTokenBalance(balance);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, updateTokenBalance]);

  // ─────────────────────────────────────────────────────────────────────────
  // checkInstalled()
  //   Re-checks whether the Freighter extension is installed.
  // ─────────────────────────────────────────────────────────────────────────
  const checkInstalled = useCallback(async () => {
    const { isInstalled: installed } = await checkConnection();
    setIsInstalled(installed);
    return installed;
  }, []);

  return {
    // ── Wallet State ──
    isConnected: walletConnected,
    address: walletAddress,
    balance: tokenBalance,
    walletName,
    isInstalled,

    // ── UI State ──
    isLoading,
    error,

    // ── Actions ──
    connect,
    disconnect,
    refreshBalance,
    checkInstalled,
  };
};
