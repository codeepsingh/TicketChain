import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { useTransferTicket, useClaimRefund, useEvents } from '../hooks/useTickets';

export const TicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketIdNum = Number(id);

  const { simTickets, testnetTickets, walletAddress, networkMode } = useTicketStore();
  const tickets = networkMode === 'simulator' ? simTickets : testnetTickets;
  const transferMutation = useTransferTicket();
  const refundMutation = useClaimRefund();
  
  const ticket = tickets.find((t) => t.id === ticketIdNum);
  const { data: events } = useEvents();
  
  const event = ticket ? events?.find((e) => e.id === ticket.eventId) : null;

  // Modal & Form states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  if (!ticket || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 pt-[120px]">
        <div className="text-center bg-surface-container border border-outline-variant/30 p-8 rounded-3xl max-w-sm w-full">
          <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
          <h3 className="font-title-md text-title-md text-on-surface">Ticket Not Found</h3>
          <p className="text-on-surface-variant mt-2 mb-6">This ticket does not exist or has been transferred out of this wallet.</p>
          <button 
            onClick={() => navigate('/my-tickets')}
            className="w-full btn-primary py-3 rounded-xl text-white font-semibold cursor-pointer"
          >
            Back to Vault
          </button>
        </div>
      </main>
    );
  }

  const getCategoryImage = (id: number) => {
    const images = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDhVq03uQjqvooBr87KGbqmjL2DnZ94xQ2jduFQQj8a_Q1AfuOkmG-FPBvBNNI3Yfp0eXqbPuazDhH5V2ut80ix_uvfR4PQDu10VbMyPA_z-co5G2cRF4BpduowcRPIrRQvSsTIPJ6AwmhG4wDMjZzL93o--hEyFNkCgDHgohBXtdjWKR5SJMHyHGMmg5N8r3e6MVFrp3M7bho9Si4wV2QcR0W1cVvBmfXAF_BkYc_rql73FHqk0V_0zexk48vsjTQWjlyk_0BQ0R19',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAWYH0h5Tv1YAHqqIeJSoGIb4L7SHznM87pkZ4ehAlI8B_FneNIO4UzgzQlUtP5eeTzwgCDPOn5qyZL33_4qcv31bQdxSeIIVPtYyOexeys7t82UCApH-9V7ZBi127LmyfVc7jqc_1reZrehprPJz3hCpAzjIPPS8pyGgXVBAKtqrZF-90oAyRudMN_wIe_2GNesHiah8A42EDTz-DDrcIkMUtrHH_FsWl0N3WEX8tyvKl-BZJvcjGGk8eqRUJLGvaI6qYrCfLAbdpr',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAhAy-jUps4TyqWvebTqG1avJnGIa7qavNUV4tB0vFSMVG12Qk2aSndhqDZ-60PvVB0PqtIxlCSW4vWoBICT367eIMVDnjRDB8nWl6rTXHjVE3QcJoHpr3kT6gNRz8ivAZARfS_skoUIJZ5F9SoAfc8fKXha7GlEef5ccIlaPJLmMk6OycfBWQ-cDaA2eLAfsm-IxZvd6BUy19GVny8X41oy8OiNYyJwXnCSb0bcyALbmpD0kyKYyjRwXHJd-HuGUMS-e1wNgHCketa'
    ];
    return images[id % images.length];
  };

  const getEventDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatAddress = (addr: string) => {
    if (addr === walletAddress) return 'You (Owner)';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recipient) {
      setErrorMsg('Recipient public key is required.');
      return;
    }

    if (!recipient.startsWith('G')) {
      setErrorMsg('Invalid Stellar address. Must start with "G".');
      return;
    }

    try {
      await transferMutation.mutateAsync({
        ticketId: ticket.id,
        toAddress: recipient,
      });
      setTransferSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transfer failed. Check your wallet logs.');
    }
  };

  const handleClaimRefund = async () => {
    if (window.confirm('Are you sure you want to claim a full refund for this ticket?')) {
      try {
        await refundMutation.mutateAsync({
          eventId: event.id,
          ticketId: ticket.id,
        });
        alert('Refund claimed successfully! XLM returned to your wallet.');
        navigate('/my-tickets');
      } catch (err: any) {
        alert(`Refund failed: ${err.message}`);
      }
    }
  };

  return (
    <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center py-stack-lg px-margin-mobile md:px-margin-desktop pt-[120px]">
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Ticket Container */}
      <div className="w-full max-w-md mx-auto">
        {/* Holographic Ticket */}
        <div className="relative w-full aspect-auto md:aspect-[1/2] min-h-[680px] md:min-h-0 rounded-[32px] bg-surface-container-low border border-outline-variant/30 overflow-hidden ticket-shadow flex flex-col">
          {/* Hologram Overlay */}
          <div className="absolute inset-0 hologram-effect z-20 mix-blend-overlay"></div>
          
          {/* Event Banner */}
          <div className="relative h-[180px] md:h-1/3 w-full shrink-0">
            <img 
              alt="Event Cover" 
              className="absolute inset-0 w-full h-full object-cover" 
              src={getCategoryImage(event.id)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent z-10"></div>
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
              <span className="bg-secondary/90 backdrop-blur text-on-secondary px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-widest shadow-lg">
                VIP Access
              </span>
              <span className="material-symbols-outlined text-white opacity-80 cursor-pointer">more_horiz</span>
            </div>
          </div>

          {/* Ticket Core Details */}
          <div className="flex-1 px-8 py-6 flex flex-col relative z-20">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2 leading-tight">
              {event.name}
            </h1>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container">calendar_today</span>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Date & Time</p>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{getEventDate(event.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container">location_on</span>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Venue</p>
                  <p className="font-body-md text-body-md text-on-surface mt-1">Stellar Ledger Network</p>
                </div>
              </div>
            </div>

            {/* QR Code & Verification */}
            <div className="mt-auto pt-8 pb-4 flex flex-col items-center">
              <div className="w-40 h-40 bg-white rounded-xl p-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-6 relative overflow-hidden flex items-center justify-center">
                {/* Real QR Code URL using the ticket ID */}
                <img 
                  alt="Ticket QR Code" 
                  className="w-full h-full object-contain" 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ticketchain:${ticket.id}`}
                />
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary/80 shadow-[0_0_10px_#f0bf6b] animate-[scan_3s_ease-in-out_infinite]"></div>
              </div>

              <div className="flex items-center gap-2 bg-surface-container/50 border border-secondary/20 rounded-full px-4 py-2">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {ticket.verified ? 'check_circle' : 'verified'}
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  {ticket.verified ? 'Gate Scanned' : 'Ownership Verified'}
                </span>
              </div>

              <div className="mt-4 text-center">
                <p className="font-body-md text-body-md text-on-surface-variant text-sm flex items-center justify-center gap-2">
                  Owner: <span className="text-on-surface font-mono text-xs bg-surface-container-highest px-2 py-1 rounded">{formatAddress(ticket.owner)}</span>
                </p>
                <span className="text-primary-container hover:text-primary transition-colors text-xs flex items-center justify-center gap-1 mt-2 cursor-pointer">
                  View on Explorer <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-stack-md flex flex-col gap-4">
          {event.status === 1 ? (
            <button 
              onClick={handleClaimRefund}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span className="material-symbols-outlined">monetization_on</span>
              Claim Refund ({event.ticketPrice} XLM)
            </button>
          ) : (
            <>
              <button className="w-full bg-gradient-to-r from-primary-container to-[#5C0A18] text-white font-label-sm text-label-sm py-4 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Add to Apple Wallet
              </button>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="flex-1 bg-transparent border border-primary-container text-primary font-label-sm text-label-sm py-4 rounded-xl hover:bg-primary-container/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined">send</span>
                  Transfer Ticket
                </button>
                <button className="flex-1 text-on-surface-variant border border-outline-variant/30 font-label-sm text-label-sm py-4 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined">download</span>
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 max-w-md w-full rounded-3xl p-8 glass-panel shadow-2xl relative animate-[scaleUp_0.2s_ease-out]">
            <button 
              onClick={() => {
                setShowTransferModal(false);
                setTransferSuccess(false);
                setRecipient('');
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!transferSuccess ? (
              <form onSubmit={handleTransferSubmit} className="space-y-6">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Transfer Ticket</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Send Ticket #{ticket.id} directly to another Stellar wallet. This action will update ownership on-chain.
                </p>

                {errorMsg && (
                  <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-sm mt-0.5">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Recipient Public Key</label>
                  <input 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
                    placeholder="Starts with G..."
                    type="text"
                  />
                </div>

                <button 
                  disabled={transferMutation.isPending}
                  className="w-full btn-primary py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer shadow-lg"
                  type="submit"
                >
                  {transferMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Transferring Ownership...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Confirm On-Chain Transfer
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Transfer Complete!</h3>
                <p className="text-sm text-on-surface-variant mb-8">
                  Ownership of Ticket #{ticket.id} has been transferred to {recipient.slice(0, 8)}...
                </p>

                <button 
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferSuccess(false);
                    navigate('/my-tickets');
                  }}
                  className="w-full btn-primary py-3 rounded-xl text-white font-semibold cursor-pointer"
                >
                  Return to Vault
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
