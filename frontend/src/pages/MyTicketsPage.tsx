import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useEvents } from '../hooks/useTickets';
import { useTicketStore } from '../store/useTicketStore';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress, walletConnected } = useTicketStore();
  const { data: tickets, isLoading } = useTickets(walletAddress);
  const { data: events } = useEvents();

  const getEventForTicket = (eventId: number) => {
    if (!events) return null;
    return events.find((e) => e.id === eventId);
  };

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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] space-y-stack-md">
      <header className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          My Ticket <span className="text-gradient-gold">Vault</span>
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your collection of cryptographically secure admission passes and proof-of-attendance credentials.
        </p>
      </header>

      {!walletConnected ? (
        <div className="max-w-md mx-auto text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px] mt-10">
          <span className="material-symbols-outlined text-[64px] text-primary mb-4">account_balance_wallet</span>
          <h3 className="font-title-md text-title-md text-on-surface">Connect Wallet</h3>
          <p className="text-on-surface-variant mt-2 mb-6">Connect your wallet to retrieve your tickets from the ledger.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px]">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">local_activity</span>
          <h3 className="font-title-md text-title-md text-on-surface">Vault is Empty</h3>
          <p className="text-on-surface-variant mt-2 mb-6">You don't own any active event tickets at this address.</p>
          <button 
            onClick={() => navigate('/events')}
            className="px-8 py-3 rounded-full btn-primary text-white font-semibold cursor-pointer"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {tickets.map((ticket) => {
            const event = getEventForTicket(ticket.eventId);
            if (!event) return null;
            return (
              <div 
                key={ticket.id}
                className="group relative bg-surface-container-low rounded-[24px] overflow-hidden border border-outline-variant/20 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-primary/50"
              >
                <div className="h-40 w-full relative overflow-hidden">
                  <img 
                    alt="Cover" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={getCategoryImage(event.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="font-label-sm text-[10px] text-secondary uppercase tracking-wider">Verified Pass</span>
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-xs font-bold text-secondary block mb-1">Ticket ID: #{ticket.id}</span>
                  <h3 className="font-title-md text-title-md text-on-surface mb-4 line-clamp-1">{event.name}</h3>
                  
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-6">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>{getEventDate(event.date)}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ticket.verified ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-primary-container/20 border border-primary-container/30 text-primary'}`}>
                      {ticket.verified ? 'Scanned' : 'Valid'}
                    </span>
                    <button 
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="btn-primary-gradient px-4 py-2 rounded-lg font-label-sm text-xs text-white cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
};
