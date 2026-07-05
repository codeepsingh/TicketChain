import React from 'react';
import { useTicketStore } from '../store/useTicketStore';

export const TransactionFeed: React.FC = () => {
  const { transactions } = useTicketStore();

  if (transactions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full space-y-3 pointer-events-none">
      {transactions.slice(0, 3).map((tx) => (
        <div 
          key={tx.id} 
          className="pointer-events-auto bg-surface-container-highest/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-300 transform translate-y-0"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tx.status === 'pending' && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
              {tx.status === 'processing' && (
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
              )}
              {tx.status === 'confirmed' && (
                <span className="material-symbols-outlined text-green-400 text-[20px]">check_circle</span>
              )}
              {tx.status === 'failed' && (
                <span className="material-symbols-outlined text-red-400 text-[20px]">error</span>
              )}
              
              <div>
                <p className="font-label-sm text-sm text-on-surface font-semibold">{tx.label}</p>
                <p className="text-xs text-on-surface-variant capitalize mt-0.5">{tx.status}</p>
              </div>
            </div>
            
            {tx.txHash && (
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1 shrink-0 font-mono"
              >
                {tx.txHash.slice(0, 6)}...
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
