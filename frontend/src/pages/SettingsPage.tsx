import React, { useState } from 'react';
import { useTicketStore } from '../store/useTicketStore';

export const SettingsPage: React.FC = () => {
  const { 
    networkMode, 
    managerContractId, 
    escrowContractId, 
    tokenBalance, 
    setNetworkMode, 
    setContractIds, 
    updateTokenBalance 
  } = useTicketStore();

  const [managerInput, setManagerInput] = useState(managerContractId);
  const [escrowInput, setEscrowInput] = useState(escrowContractId);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setContractIds(managerInput, escrowInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFaucet = () => {
    updateTokenBalance(tokenBalance + 100);
    alert('Simulated Faucet Triggered! 100 XLM added to your balance.');
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] space-y-stack-md">
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          System <span className="text-gradient-gold">Settings</span>
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Configure ledger credentials, toggle execution environments, and trigger sandbox tools.
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Network Selection Mode */}
        <section className="glass-card rounded-[32px] p-8 space-y-6">
          <h3 className="font-title-md text-title-md text-on-surface">Ledger Operation Mode</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setNetworkMode('simulator')}
              className={`p-6 rounded-2xl border text-left transition-all cursor-pointer ${networkMode === 'simulator' ? 'border-primary bg-primary/5 text-on-surface' : 'border-outline-variant/30 bg-surface-container/50 hover:bg-surface-container text-on-surface-variant'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-lg font-title-md text-on-surface">Simulated Sandbox</span>
                {networkMode === 'simulator' && <span className="material-symbols-outlined text-primary">radio_button_checked</span>}
              </div>
              <p className="text-sm leading-relaxed">Runs in local memory with preloaded mock events. Perfect for safe demo execution and instant speed testing without wallet extensions.</p>
            </button>

            <button 
              onClick={() => setNetworkMode('testnet')}
              className={`p-6 rounded-2xl border text-left transition-all cursor-pointer ${networkMode === 'testnet' ? 'border-secondary bg-secondary/5 text-on-surface' : 'border-outline-variant/30 bg-surface-container/50 hover:bg-surface-container text-on-surface-variant'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-lg font-title-md text-on-surface">Stellar Testnet</span>
                {networkMode === 'testnet' && <span className="material-symbols-outlined text-secondary">radio_button_checked</span>}
              </div>
              <p className="text-sm leading-relaxed">Runs real live Soroban smart contracts. Submits transactions directly to the Stellar Testnet ledger via Freighter Wallet plugin.</p>
            </button>
          </div>
        </section>

        {/* Faucet for Simulated Sandbox */}
        {networkMode === 'simulator' && (
          <section className="glass-card rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">Simulated XLM Faucet</h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                Claim additional sandbox currency to test tickets purchases.
              </p>
            </div>
            <button 
              onClick={handleFaucet}
              className="btn-primary-gradient px-8 py-3.5 rounded-xl text-white font-semibold flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined">monetization_on</span>
              Claim 100 XLM
            </button>
          </section>
        )}

        {/* Friendbot for Testnet */}
        {networkMode === 'testnet' && (
          <section className="glass-card rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">Stellar Testnet Friendbot</h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                Fund your testnet account with Friendbot to purchase tickets.
              </p>
            </div>
            <a 
              href="https://laboratory.stellar.org/#account-creator?network=testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient px-8 py-3.5 rounded-xl text-white font-semibold flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined">waves</span>
              Go to Friendbot
            </a>
          </section>
        )}

        {/* Smart Contract Configuration Form */}
        <section className="glass-card rounded-[32px] p-8">
          <h3 className="font-title-md text-title-md text-on-surface mb-6">Soroban Smart Contract Anchors</h3>
          
          <form onSubmit={handleSave} className="space-y-6">
            {saveSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-start gap-2">
                <span className="material-symbols-outlined shrink-0 text-sm mt-0.5">check_circle</span>
                <span>Contract credentials updated and registered in system memory!</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Ticket Manager Contract ID</label>
              <input 
                value={managerInput}
                onChange={(e) => setManagerInput(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-mono text-sm focus:border-primary-container outline-none" 
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Ticket Escrow Contract ID</label>
              <input 
                value={escrowInput}
                onChange={(e) => setEscrowInput(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-mono text-sm focus:border-primary-container outline-none" 
                type="text"
              />
            </div>

            <button 
              className="w-full btn-primary py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer shadow-lg"
              type="submit"
            >
              <span className="material-symbols-outlined">save</span>
              Save Credentials
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
