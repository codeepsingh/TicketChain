import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useCancelEvent, useCompleteEvent } from '../hooks/useTickets';
import { useTicketStore } from '../store/useTicketStore';
import { connectStellarWallet } from '../services/stellar';

export const OrganizerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allEvents, isLoading } = useEvents();
  const { walletAddress, walletConnected, networkMode } = useTicketStore();
  
  const cancelMutation = useCancelEvent();
  const completeMutation = useCompleteEvent();

  // Filter events created by this organizer
  const myEvents = useMemo(() => {
    if (!allEvents || !walletAddress) return [];
    return allEvents.filter((e) => e.organizer === walletAddress);
  }, [allEvents, walletAddress]);

  // Dynamic calculations
  const stats = useMemo(() => {
    if (myEvents.length === 0) {
      return { revenue: 0, sold: 0, activeCount: 0, avgAttendance: 0 };
    }
    
    let revenue = 0;
    let sold = 0;
    let max = 0;
    let activeCount = 0;

    myEvents.forEach((e) => {
      revenue += e.ticketPrice * e.soldTickets;
      sold += e.soldTickets;
      max += e.maxTickets;
      if (e.status === 0) activeCount++;
    });

    const avgAttendance = max > 0 ? Math.round((sold / max) * 100) : 0;

    return { revenue, sold, activeCount, avgAttendance };
  }, [myEvents]);

  const handleCancel = async (eventId: number) => {
    if (window.confirm(`Are you sure you want to CANCEL Event #${eventId}? This will enable buyers to claim full refunds.`)) {
      try {
        await cancelMutation.mutateAsync({ eventId });
      } catch (err: any) {
        alert(`Failed to cancel event: ${err.message}`);
      }
    }
  };

  const handleComplete = async (eventId: number) => {
    if (window.confirm(`Are you sure you want to COMPLETE Event #${eventId}? This will disburse ticket sales from escrow to your wallet.`)) {
      try {
        await completeMutation.mutateAsync({ eventId });
      } catch (err: any) {
        alert(`Failed to complete event: ${err.message}`);
      }
    }
  };



  return (
    <div className="min-h-screen bg-pattern flex bg-background text-on-surface pt-[80px]">
      {/* SideNavBar */}
      <nav className="bg-surface-container-low h-screen w-64 fixed left-0 top-0 shadow-lg flex flex-col py-stack-md z-40 hidden md:flex border-r border-outline-variant/30 pt-[100px]">
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/50 relative flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">account_circle</span>
          </div>
          <div>
            <h2 className="font-title-md text-[18px] font-bold text-on-surface leading-tight">Organizer Portal</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant font-normal mt-1">Stellar Network</p>
          </div>
        </div>
        
        <div className="px-6 mb-8">
          <button 
            onClick={() => navigate('/create-event')}
            className="w-full py-3 px-4 rounded-lg btn-primary text-white font-label-sm text-label-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Event
          </button>
        </div>

        <ul className="flex flex-col gap-2 flex-grow">
          <li>
            <a className="bg-primary-container text-on-primary-container rounded-lg mx-2 flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group">
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">dashboard</span>
              <span className="font-label-sm text-label-sm">Overview</span>
            </a>
          </li>
          <li>
            <a onClick={() => navigate('/events')} className="text-on-surface-variant hover:bg-surface-container-highest rounded-lg mx-2 flex items-center gap-3 px-4 py-3 hover:bg-surface-variant transition-all cursor-pointer group">
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">event</span>
              <span className="font-label-sm text-label-sm group-hover:text-primary transition-colors">Events</span>
            </a>
          </li>
          <li>
            <a onClick={() => navigate('/verify')} className="text-on-surface-variant hover:bg-surface-container-highest rounded-lg mx-2 flex items-center gap-3 px-4 py-3 hover:bg-surface-variant transition-all cursor-pointer group">
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">qr_code_scanner</span>
              <span className="font-label-sm text-label-sm group-hover:text-primary transition-colors">Gate Scanner</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        {!walletConnected ? (
          <div className="max-w-md mx-auto text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px] mt-10">
            <span className="material-symbols-outlined text-[64px] text-primary mb-4">account_balance_wallet</span>
            <h3 className="font-title-md text-title-md text-on-surface">Connect Your Wallet</h3>
            <p className="text-on-surface-variant mt-2 mb-6">You need to connect a Stellar wallet to manage your hosted events.</p>
            <button 
              onClick={() => connectStellarWallet(networkMode)}
              className="btn-primary-gradient px-8 py-3 rounded-full font-label-sm text-label-sm text-white cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="max-w-container-max mx-auto space-y-stack-md">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-stack-md">
              <div>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Organizer Overview</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Welcome back. Manage your hosted smart contracts and escrow states here.</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/create-event')}
                  className="md:hidden py-3 px-6 rounded-lg btn-primary text-white font-label-sm text-label-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Event
                </button>
              </div>
            </header>

            {/* Analytics Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-[48px] text-primary">account_balance_wallet</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Total Revenue</p>
                <p className="font-title-md text-[32px] font-bold text-on-surface mb-4">{stats.revenue.toLocaleString()} XLM</p>
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span className="font-label-sm text-[12px]">Direct escrow volume</span>
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-[48px] text-secondary">local_activity</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Tickets Sold</p>
                <p className="font-title-md text-[32px] font-bold text-on-surface mb-4">{stats.sold}</p>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="font-label-sm text-[12px]">Across {myEvents.length} events</span>
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-[48px] text-primary">campaign</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Active Events</p>
                <p className="font-title-md text-[32px] font-bold text-on-surface mb-4">{stats.activeCount}</p>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span className="font-label-sm text-[12px]">Open for public sales</span>
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-[48px] text-secondary">groups</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Fill Rate</p>
                <p className="font-title-md text-[32px] font-bold text-on-surface mb-4">{stats.avgAttendance}%</p>
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span className="font-label-sm text-[12px]">Average capacity filled</span>
                </div>
              </div>
            </section>

            {/* Managed Events List */}
            <section className="glass-card rounded-[32px] p-6 md:p-8">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-6">Your Hosted Events</h3>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : myEvents.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-2">event_busy</span>
                  <p>You haven't hosted any events yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-on-surface-variant font-label-sm text-sm">
                        <th className="py-4">Event ID</th>
                        <th className="py-4">Event Name</th>
                        <th className="py-4">Ticket Price</th>
                        <th className="py-4">Sold / Capacity</th>
                        <th className="py-4">Status</th>
                        <th className="py-4 text-right">Escrow Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-body-md text-sm">
                      {myEvents.map((event) => {
                        const statusColors = [
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', // Open
                          'bg-red-500/10 border-red-500/20 text-red-400', // Cancelled
                          'bg-blue-500/10 border-blue-500/20 text-blue-400', // Completed
                        ];
                        const statusLabels = ['Active', 'Cancelled', 'Completed'];
                        
                        return (
                          <tr key={event.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 font-mono font-bold text-secondary">#{event.id}</td>
                            <td className="py-4 font-semibold text-on-surface">{event.name}</td>
                            <td className="py-4">{event.ticketPrice} XLM</td>
                            <td className="py-4">
                              {event.soldTickets} / {event.maxTickets}
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${statusColors[event.status]}`}>
                                {statusLabels[event.status]}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              {event.status === 0 ? (
                                <div className="flex gap-2 justify-end">
                                  <button 
                                    disabled={cancelMutation.isPending || completeMutation.isPending}
                                    onClick={() => handleCancel(event.id)}
                                    className="bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    disabled={cancelMutation.isPending || completeMutation.isPending}
                                    onClick={() => handleComplete(event.id)}
                                    className="bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Disburse Escrow
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant font-mono">Escrow Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
