import React from 'react';
import { useTicketStore } from '../store/useTicketStore';
import { useTickets } from '../hooks/useTickets';
import { connectStellarWallet } from '../services/stellar';

export const ProfilePage: React.FC = () => {
  const { walletAddress, walletConnected, tokenBalance, walletName, networkMode } = useTicketStore();
  const { data: tickets } = useTickets(walletAddress);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] space-y-stack-md">
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          User <span className="text-gradient-gold">Profile</span>
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your decentralised identity credentials on the Stellar network.
        </p>
      </header>

      <div className="max-w-md mx-auto">
        {!walletConnected ? (
          <div className="text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px]">
            <span className="material-symbols-outlined text-[64px] text-primary mb-4">account_circle</span>
            <h3 className="font-title-md text-title-md text-on-surface">Connect Wallet</h3>
            <p className="text-on-surface-variant mt-2 mb-6">Connect your wallet to retrieve your profile metadata.</p>
            <button 
              onClick={() => connectStellarWallet(networkMode)}
              className="btn-primary-gradient px-8 py-3 rounded-full font-label-sm text-label-sm text-white cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-[32px] p-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-surface-container-high border-2 border-primary/50 relative overflow-hidden flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[64px] text-secondary">account_circle</span>
            </div>

            <h3 className="font-title-md text-title-md text-on-surface mb-1">{walletName || 'Stellar Holder'}</h3>
            <span className="text-xs text-secondary font-mono bg-surface-container px-3 py-1 rounded-full border border-white/5">
              Stellar Testnet Node
            </span>

            <div className="w-full space-y-4 mt-8 border-t border-white/5 pt-6 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-on-surface-variant">Wallet Address</span>
                <span className="font-mono text-on-surface text-right max-w-[200px] truncate">{formatAddress(walletAddress || '')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-on-surface-variant">Available Balance</span>
                <span className="font-semibold text-secondary">{tokenBalance.toLocaleString()} XLM</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-on-surface-variant">Ticket Inventory</span>
                <span className="font-semibold text-primary">{tickets.length} Active Passes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
