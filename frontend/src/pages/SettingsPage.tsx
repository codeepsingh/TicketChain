import React, { useState } from 'react';
import { useTicketStore } from '../store/useTicketStore';

export const SettingsPage: React.FC = () => {
  const { 
    managerContractId, 
    escrowContractId, 
    setContractIds 
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
        {/* Friendbot for Testnet */}
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
