import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useEvents } from '../hooks/useTickets';
import { useTicketStore } from '../store/useTicketStore';
import { connectStellarWallet } from '../services/stellar';

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress, walletConnected, tokenBalance, activities, networkMode } = useTicketStore();
  const { data: tickets, isLoading: ticketsLoading } = useTickets(walletAddress);
  const { data: events } = useEvents();

  // Find event helper
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

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatTxHash = (hash?: string) => {
    if (!hash) return '';
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen pt-[120px] space-y-stack-md">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {!walletConnected ? (
        <div className="max-w-md mx-auto text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px] mt-10">
          <span className="material-symbols-outlined text-[64px] text-primary mb-4">account_balance_wallet</span>
          <h3 className="font-title-md text-title-md text-on-surface">Connect Wallet</h3>
          <p className="text-on-surface-variant mt-2 mb-6">Connect your Stellar wallet to view your personal dashboard and tickets.</p>
          <button 
            onClick={() => connectStellarWallet(networkMode)}
            className="btn-primary-gradient px-8 py-3 rounded-full font-label-sm text-label-sm text-white cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-stack-md">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">My Dashboard</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">View your on-chain ticket credentials, activities, and balance.</p>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg">
              <div>
                <p className="text-[12px] font-label-sm text-on-surface-variant uppercase tracking-wider">Account Balance</p>
                <p className="font-title-md text-secondary font-bold leading-tight">{tokenBalance.toLocaleString()} XLM</p>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div>
                <p className="text-[12px] font-label-sm text-on-surface-variant uppercase tracking-wider">Address</p>
                <p className="font-mono text-xs text-on-surface font-semibold mt-1">{formatAddress(walletAddress || '')}</p>
              </div>
            </div>
          </header>

          {/* Cards & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tickets Grid Left */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-[32px] p-6 md:p-8">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-6">Your Tickets</h3>
                
                {ticketsLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-10 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] mb-2 text-on-surface-variant">local_activity</span>
                    <p>No tickets found in this wallet.</p>
                    <button 
                      onClick={() => navigate('/events')}
                      className="mt-4 px-6 py-2.5 rounded-full btn-primary text-white text-xs font-semibold cursor-pointer"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tickets.map((ticket) => {
                      const event = getEventForTicket(ticket.eventId);
                      if (!event) return null;
                      return (
                        <div 
                          key={ticket.id} 
                          className="bg-surface-container-high border border-outline-variant/20 rounded-[20px] p-4 flex flex-col justify-between hover:border-primary/50 transition-colors"
                        >
                          <div className="flex gap-4">
                            <img 
                              alt="Cover" 
                              className="w-16 h-16 rounded-xl object-cover" 
                              src={getCategoryImage(event.id)}
                            />
                            <div>
                              <h4 className="font-title-md text-sm text-on-surface font-semibold line-clamp-1">{event.name}</h4>
                              <p className="text-xs text-on-surface-variant mt-0.5">{getEventDate(event.date)}</p>
                              <span className="font-mono text-xs text-secondary font-bold block mt-1">ID #{ticket.id}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.verified ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-primary-container/20 border border-primary-container/30 text-primary'}`}>
                              {ticket.verified ? 'Scanned' : 'Valid'}
                            </span>
                            <button 
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                              className="text-xs text-secondary font-semibold hover:text-primary transition-colors cursor-pointer"
                            >
                              View Ticket
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Activities Sidebar Right */}
            <div className="space-y-6">
              <div className="glass-card rounded-[32px] p-6 md:p-8 flex flex-col h-full max-h-[600px] overflow-hidden">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-6">Recent Activities</h3>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                  {activities.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center py-6">No recent ledger events logged.</p>
                  ) : (
                    activities.map((act) => {
                      const icons = {
                        event_created: 'add_circle',
                        ticket_purchased: 'shopping_bag',
                        ticket_transferred: 'swap_horiz',
                        ticket_verified: 'qr_code_scanner',
                        event_cancelled: 'cancel',
                        event_completed: 'task_alt',
                        funds_withdrawn: 'monetization_on',
                      };
                      const colors = {
                        event_created: 'text-blue-400',
                        ticket_purchased: 'text-secondary',
                        ticket_transferred: 'text-purple-400',
                        ticket_verified: 'text-green-400',
                        event_cancelled: 'text-red-400',
                        event_completed: 'text-indigo-400',
                        funds_withdrawn: 'text-amber-400',
                      };

                      return (
                        <div key={act.id} className="flex gap-3 text-xs border-b border-white/5 pb-3">
                          <span className={`material-symbols-outlined shrink-0 ${colors[act.type] || 'text-on-surface-variant'} text-[18px]`}>
                            {icons[act.type] || 'circle'}
                          </span>
                          <div className="space-y-1">
                            <p className="text-on-surface-variant leading-relaxed">{act.details}</p>
                            <div className="flex gap-2 items-center text-[10px] text-on-surface-variant">
                              <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span className="font-mono text-secondary truncate" title={act.txHash}>{formatTxHash(act.txHash)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
