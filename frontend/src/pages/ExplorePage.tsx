import React, { useState, useMemo } from 'react';
import { useEvents, usePurchaseTicket } from '../hooks/useTickets';
import { useTicketStore } from '../store/useTicketStore';

export const ExplorePage: React.FC = () => {
  const { data: events, isLoading } = useEvents();
  const purchaseMutation = usePurchaseTicket();
  const { walletConnected, tokenBalance } = useTicketStore();

  // Search & Filter States
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('All Categories');
  const [searchDate, setSearchDate] = useState('');
  
  // Purchase Modal State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper functions
  const getCategory = (id: number) => {
    const categories = ['Music', 'Art & Design', 'Culinary', 'Tech Conferences'];
    return categories[id % categories.length];
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

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      const matchLoc = searchLocation === '' || e.name.toLowerCase().includes(searchLocation.toLowerCase());
      const matchCat = searchCategory === 'All Categories' || getCategory(e.id) === searchCategory;
      let matchDate = true;
      if (searchDate) {
        const targetDate = new Date(searchDate).toDateString();
        const eventDate = new Date(e.date * 1000).toDateString();
        matchDate = targetDate === eventDate;
      }
      return matchLoc && matchCat && matchDate && e.status === 0; // Show open events
    });
  }, [events, searchLocation, searchCategory, searchDate]);

  const handleOpenPurchase = (event: any) => {
    if (!walletConnected) {
      alert('Please connect your wallet first in the top navbar!');
      return;
    }
    setSelectedEvent(event);
    setPurchaseQuantity(1);
    setErrorMsg(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedEvent) return;
    setErrorMsg(null);

    const cost = selectedEvent.ticketPrice * purchaseQuantity;
    if (tokenBalance < cost) {
      setErrorMsg('Insufficient XLM balance for this transaction.');
      return;
    }

    try {
      await purchaseMutation.mutateAsync({
        eventId: selectedEvent.id,
        quantity: purchaseQuantity,
      });
      setSelectedEvent(null);
      setShowSuccessModal(true);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Transaction failed. Check your Freighter wallet logs.');
    }
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-stack-lg min-h-screen pt-[120px]">
      {/* Header Section */}
      <header className="text-center space-y-stack-sm max-w-2xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg md:font-display-xl md:text-display-xl text-on-surface">
          Discover <span className="text-gradient-gold">Exclusive</span> Events
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Secure your spot at the world's most premium gatherings. Verified on the Stellar network for guaranteed authenticity.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <section className="glass-panel rounded-[24px] p-6 max-w-5xl mx-auto shadow-2xl relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant pl-1">Search Event</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-surface-container-high border-b border-surface-container-high focus:border-primary-container text-on-surface font-body-md text-body-md py-3 pl-10 pr-4 rounded-t-lg transition-colors focus:ring-0 outline-none" 
                placeholder="Search by title..." 
                type="text"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant pl-1">Category</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">category</span>
              <select 
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full bg-surface-container-high border-b border-surface-container-high focus:border-primary-container text-on-surface font-body-md text-body-md py-3 pl-10 pr-8 rounded-t-lg transition-colors focus:ring-0 appearance-none outline-none"
              >
                <option>All Categories</option>
                <option>Tech Conferences</option>
                <option>Music Festivals</option>
                <option>Art Exhibitions</option>
                <option>Culinary</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant pl-1">Date</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">calendar_month</span>
              <input 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full bg-surface-container-high border-b border-surface-container-high focus:border-primary-container text-on-surface font-body-md text-body-md py-3 pl-10 pr-4 rounded-t-lg transition-colors focus:ring-0 [color-scheme:dark] outline-none" 
                type="date"
              />
            </div>
          </div>
          <div>
            <button 
              onClick={() => {
                setSearchLocation('');
                setSearchCategory('All Categories');
                setSearchDate('');
              }}
              className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm py-3 rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">restart_alt</span>
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* Event Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low border border-outline-variant/20 rounded-[24px]">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">event_busy</span>
          <h3 className="font-title-md text-title-md text-on-surface">No Events Found</h3>
          <p className="text-on-surface-variant mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filteredEvents.map((event) => {
            const isSoldOut = event.soldTickets >= event.maxTickets;
            return (
              <article 
                key={event.id}
                className="group relative bg-surface-container-low rounded-[24px] overflow-hidden border border-outline-variant/20 event-card-shadow transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                <div className="relative h-64 w-full shrink-0">
                  <img 
                    alt="Event Cover" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    src={getCategoryImage(event.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-90"></div>
                  <div className="absolute top-4 right-4 bg-surface/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="font-label-sm text-[12px] text-on-surface">Stellar Verified</span>
                  </div>
                  {isSoldOut && (
                    <div className="absolute top-4 left-4 bg-red-950/80 border border-red-500/20 text-red-400 px-3 py-1 rounded-full font-label-sm text-[12px]">
                      Sold Out
                    </div>
                  )}
                </div>
                <div className="p-6 relative flex-grow flex flex-col justify-between">
                  <div className="absolute -top-12 right-6 bg-surface-container-high px-4 py-2 rounded-lg border border-outline-variant/30 shadow-lg">
                    <span className="font-title-md text-title-md text-secondary block leading-none">{event.ticketPrice} XLM</span>
                  </div>
                  <div>
                    <h3 className="font-title-md text-title-md text-on-surface mb-2">{event.name}</h3>
                    <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md mb-1">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      <span>{getEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md mb-4">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span>Stellar Network</span>
                    </div>
                    <div className="text-xs text-on-surface-variant mb-6">
                      Inventory: <span className="text-on-surface font-semibold">{event.maxTickets - event.soldTickets} / {event.maxTickets}</span> tickets remaining
                    </div>
                  </div>
                  
                  <button 
                    disabled={isSoldOut}
                    onClick={() => handleOpenPurchase(event)}
                    className="w-full bg-transparent border border-primary-container text-primary font-label-sm text-label-sm py-3 rounded-lg group-hover:bg-primary-container group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSoldOut ? 'Sold Out' : 'Get Tickets'}
                  </button>
                  {/* Spacer for hover button */}
                  <div className="h-10 group-hover:block hidden"></div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* PURCHASE MODAL OVERLAY */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 max-w-md w-full rounded-3xl p-8 glass-panel shadow-2xl relative animate-[scaleUp_0.2s_ease-out]">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Purchase Tickets</h3>
            <p className="text-sm text-on-surface-variant mb-6">{selectedEvent.name}</p>

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
                <span className="material-symbols-outlined shrink-0 text-sm mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-surface-container/50 p-4 rounded-2xl">
                <span className="text-sm text-on-surface-variant font-medium">Ticket Price</span>
                <span className="text-secondary font-bold font-title-md">{selectedEvent.ticketPrice} XLM</span>
              </div>

              <div className="flex justify-between items-center bg-surface-container/50 p-4 rounded-2xl">
                <span className="text-sm text-on-surface-variant font-medium">Select Quantity</span>
                <div className="flex items-center gap-4 bg-background/50 border border-white/5 rounded-full px-3 py-1">
                  <button 
                    disabled={purchaseQuantity <= 1}
                    onClick={() => setPurchaseQuantity(purchaseQuantity - 1)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="font-title-md text-on-surface font-semibold text-lg">{purchaseQuantity}</span>
                  <button 
                    disabled={purchaseQuantity >= selectedEvent.maxTickets - selectedEvent.soldTickets}
                    onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-surface-container/50 p-4 rounded-2xl">
                <span className="text-sm text-on-surface-variant font-medium">Total Cost</span>
                <span className="text-primary font-bold font-title-md">{selectedEvent.ticketPrice * purchaseQuantity} XLM</span>
              </div>
            </div>

            <button 
              disabled={purchaseMutation.isPending}
              onClick={handleConfirmPurchase}
              className="w-full btn-primary py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer shadow-lg"
            >
              {purchaseMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Waiting for Wallet Signature...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">shopping_cart</span>
                  Sign & Pay with Freighter
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 max-w-sm w-full rounded-3xl p-8 glass-panel shadow-2xl text-center animate-[scaleUp_0.2s_ease-out]">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Purchase Successful!</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Your tickets have been minted on-chain. You can view them in the "My Tickets" section of your dashboard.
            </p>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold cursor-pointer"
            >
              Excellent
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
