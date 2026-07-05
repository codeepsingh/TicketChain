import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEvent } from '../hooks/useTickets';
import { useTicketStore } from '../store/useTicketStore';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateEvent();
  const { walletConnected } = useTicketStore();

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(10);
  const [maxTickets, setMaxTickets] = useState<number>(100);
  const [dateStr, setDateStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!walletConnected) {
      setErrorMsg('Please connect your wallet first in the top navbar!');
      return;
    }

    if (!name || !price || !maxTickets || !dateStr) {
      setErrorMsg('All fields are required.');
      return;
    }

    const dateUnix = Math.floor(new Date(dateStr).getTime() / 1000);
    if (dateUnix < Date.now() / 1000) {
      setErrorMsg('Event date must be in the future.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        price,
        maxTickets,
        date: dateUnix,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Smart contract execution failed. Check your wallet logs.');
    }
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] relative">
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        <header className="text-center space-y-2">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Create On-Chain <span className="text-gradient-gold">Event</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Establish a fraud-proof ticketing schedule on the Stellar Soroban network.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="glass-card rounded-[32px] p-8 md:p-12 space-y-6">
          {errorMsg && (
            <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
              <span className="material-symbols-outlined shrink-0 text-sm mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Event Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
              placeholder="e.g. Decentralized Beats Concert"
              type="text"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Ticket Price (XLM)</label>
              <input 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Maximum Ticket Capacity</label>
              <input 
                value={maxTickets}
                onChange={(e) => setMaxTickets(Number(e.target.value))}
                min={1}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Event Date & Time</label>
            <input 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none [color-scheme:dark]" 
              type="datetime-local"
            />
          </div>

          <button 
            disabled={createMutation.isPending}
            className="w-full btn-primary py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer shadow-lg mt-8"
            type="submit"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publishing to Soroban Network...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">rocket_launch</span>
                Publish Event
              </>
            )}
          </button>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 max-w-sm w-full rounded-3xl p-8 glass-panel shadow-2xl text-center animate-[scaleUp_0.2s_ease-out]">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Event Published!</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Your event has been recorded on the Stellar ledger. Check the Organizer Overview to manage sales.
            </p>

            <button 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/dashboard/organizer');
              }}
              className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold cursor-pointer"
            >
              Go to Portal
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
