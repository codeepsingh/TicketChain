import React, { useState } from 'react';
import { useTicketStore } from '../store/useTicketStore';
import { useVerifyTicket, useEvents } from '../hooks/useTickets';
import { connectStellarWallet } from '../services/stellar';

export const VerifyPage: React.FC = () => {
  const { simTickets, testnetTickets, walletConnected, networkMode } = useTicketStore();
  const tickets = networkMode === 'simulator' ? simTickets : testnetTickets;
  const { data: events } = useEvents();
  const verifyMutation = useVerifyTicket();

  // State
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error';
    message: string;
    details?: {
      ticketId: number;
      eventName: string;
      owner: string;
    };
  } | null>(null);

  const handleVerify = async (id: number) => {
    setResult(null);
    setScanning(true);
    
    // Simulate camera lock-on
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setScanning(false);

    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) {
      setResult({
        status: 'error',
        message: `Ticket ID #${id} does not exist on the ledger. Verification Denied!`,
      });
      return;
    }

    const event = events?.find((e) => e.id === ticket.eventId);
    if (!event) {
      setResult({
        status: 'error',
        message: 'Associated event metadata not found.',
      });
      return;
    }

    // Gate rules
    if (event.status === 1) {
      setResult({
        status: 'error',
        message: `EVENT CANCELLED: Event "${event.name}" has been cancelled. Verification Denied!`,
      });
      return;
    }

    if (ticket.verified) {
      setResult({
        status: 'error',
        message: `FRAUD DETECTED: Ticket ID #${id} has already been scanned at the gate! Double-spend blocked.`,
      });
      return;
    }

    try {
      await verifyMutation.mutateAsync({ ticketId: id });
      setResult({
        status: 'success',
        message: 'ACCESS GRANTED: Ticket is authentic and active.',
        details: {
          ticketId: id,
          eventName: event.name,
          owner: ticket.owner,
        },
      });
    } catch (err: any) {
      console.error(err);
      setResult({
        status: 'error',
        message: err.message || 'Smart contract verification execution failed.',
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketIdInput) return;
    handleVerify(Number(ticketIdInput));
  };

  // Helper to pick a demo ticket for quick testing
  const findDemoTicket = () => {
    const unscanned = tickets.find(t => !t.verified);
    return unscanned ? unscanned.id : null;
  };

  const demoTicketId = findDemoTicket();

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] space-y-stack-md">
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Gate <span className="text-gradient-gold">Verification</span> Portal
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Validate holographic ticket credentials in real-time at the venue entrance.
        </p>
      </header>

      {!walletConnected ? (
        <div className="max-w-md mx-auto text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px] mt-10">
          <span className="material-symbols-outlined text-[64px] text-primary mb-4">account_balance_wallet</span>
          <h3 className="font-title-md text-title-md text-on-surface">Connect Your Wallet</h3>
          <p className="text-on-surface-variant mt-2 mb-6">You need to connect a Stellar wallet to run gate verification signatures.</p>
          <button 
            onClick={() => connectStellarWallet(networkMode)}
            className="btn-primary-gradient px-8 py-3 rounded-full font-label-sm text-label-sm text-white cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* Scanner view Left */}
          <div className="glass-card rounded-[32px] p-6 flex flex-col items-center justify-center aspect-video relative overflow-hidden border border-outline-variant/30 min-h-[350px]">
          {scanning ? (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10">
              <div className="w-48 h-48 border-2 border-dashed border-secondary/50 rounded-2xl relative animate-pulse flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-secondary">qr_code_scanner</span>
                {/* Scan line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary shadow-[0_0_8px_#f0bf6b] animate-[scan_2s_infinite]"></div>
              </div>
              <p className="text-sm font-semibold text-secondary mt-6 uppercase tracking-widest">Scanning Ticket...</p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <span className="material-symbols-outlined text-[80px] text-on-surface-variant opacity-50">videocam</span>
              <p className="text-sm text-on-surface-variant max-w-xs">
                To verify, enter the Ticket ID manually, or trigger a simulator scan.
              </p>
              
              {demoTicketId ? (
                <button 
                  onClick={() => handleVerify(demoTicketId)}
                  className="px-6 py-3 rounded-full btn-primary text-white font-semibold flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  Simulate Scan Ticket #{demoTicketId}
                </button>
              ) : (
                <p className="text-xs text-secondary font-semibold">No unscanned tickets in the wallet vault to simulate.</p>
              )}
            </div>
          )}
        </div>

        {/* Manual search and Results Right */}
        <div className="space-y-6">
          {/* Manual Input Form */}
          <div className="glass-card rounded-[32px] p-8">
            <h3 className="font-title-md text-title-md text-on-surface mb-6">Manual Validation</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Ticket Credential ID</label>
                <div className="flex gap-2">
                  <input 
                    value={ticketIdInput}
                    onChange={(e) => setTicketIdInput(e.target.value)}
                    className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container outline-none" 
                    placeholder="e.g. 101"
                    type="number"
                  />
                  <button 
                    disabled={!ticketIdInput}
                    className="px-6 py-3 rounded-xl bg-secondary text-on-secondary font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                    type="submit"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Verification Results */}
          {result && (
            <div className={`glass-card rounded-[32px] p-8 border ${result.status === 'success' ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-red-500/30 bg-red-950/5'} animate-[scaleUp_0.2s_ease-out]`}>
              <div className="flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${result.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {result.status === 'success' ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <div>
                  <h3 className={`font-title-md text-[18px] font-bold ${result.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.message}
                  </h3>
                  
                  {result.details && (
                    <div className="mt-6 space-y-3 text-sm border-t border-white/5 pt-4">
                      <div>
                        <span className="text-on-surface-variant font-label-sm block text-[11px] uppercase tracking-wider">Event Name</span>
                        <span className="text-on-surface font-semibold">{result.details.eventName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-on-surface-variant font-label-sm block text-[11px] uppercase tracking-wider">Ticket ID</span>
                          <span className="text-secondary font-mono font-bold">#{result.details.ticketId}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-label-sm block text-[11px] uppercase tracking-wider">Holder Address</span>
                          <span className="text-on-surface font-mono text-xs block truncate">{result.details.owner.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </main>
  );
};
