import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useTickets';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: events } = useEvents();

  // Categories map to handle tags
  const getCategory = (id: number) => {
    const categories = ['Music', 'Art & Design', 'Culinary', 'Tech Conferences'];
    return categories[id % categories.length];
  };

  const getCategoryImage = (id: number) => {
    // Return the image URLs from the Stitch design
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
    <main className="pt-[100px]">
      {/* SECTION 1 - HERO */}
      <section className="relative min-h-[921px] flex items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-stack-lg">
        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter relative z-10 w-full items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-stack-md">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-secondary">Stellar Network Live</span>
              </div>
              <h1 className="font-display-xl text-display-xl text-on-surface leading-tight">
                Fraud-Proof Ticketing For <span className="text-gradient-gold">Modern Events</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Create, sell, transfer, and verify blockchain-backed event tickets powered by Stellar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => navigate('/events')}
                className="btn-primary-gradient px-8 py-4 rounded-full font-title-md text-[18px] text-white hover:opacity-90 transition-opacity active:scale-95 shadow-lg shadow-primary-container/30 cursor-pointer"
              >
                Explore Events
              </button>
              <button 
                onClick={() => navigate('/create-event')}
                className="px-8 py-4 rounded-full font-title-md text-[18px] text-on-surface border border-primary-container hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
              >
                Create Event
              </button>
            </div>

            <div className="flex items-center gap-8 pt-stack-sm border-t border-white/5 mt-4">
              <div>
                <p className="font-title-md text-title-md text-on-surface">10,000+</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Tickets Verified</p>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">500+</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Events Hosted</p>
              </div>
            </div>
          </div>

          {/* Right Content: Floating Ticket Mockup */}
          <div className="relative w-full aspect-[4/5] max-w-[500px] mx-auto lg:ml-auto perspective-1000">
            <div className="w-full h-full relative ticket-glow transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
              <div className="absolute inset-0 bg-surface-container-highest rounded-3xl overflow-hidden glass-panel premium-shadow flex flex-col">
                {/* Ticket Header Image */}
                <div className="h-2/5 w-full relative">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEf1B2IrPz5fNseHX-9O4OULJA8WyflADULtrH6VpqeexaNqp3y-Eg2xrU5WfvtrgRonf5ExyjV2dOF3AgaGir5xrk1zaXQdGsY5IFL3i0QMeB2KU_bG0txZVNlOFJROXAGlrVii7XgfeoCt_it0LiKfT-QMqDAxCfgxcZyDPMXIYloSSmvyJeQ0cE3BpWFLNjdBYUWtg5KKQGM4USBbj7NoMbarUMfa1y_CfIEIsZ2kyARR1bwOv175_1OwGMsZXdAsHq4cZekl4z')" }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="font-label-sm text-[12px] text-secondary">Verified</span>
                  </div>
                </div>
                {/* Ticket Details */}
                <div className="p-8 flex-1 flex flex-col justify-between relative">
                  {/* Cutouts for ticket look */}
                  <div className="absolute left-[-16px] top-0 w-8 h-8 rounded-full bg-background"></div>
                  <div className="absolute right-[-16px] top-0 w-8 h-8 rounded-full bg-background"></div>
                  <div className="w-full h-px border-t-2 border-dashed border-white/10 absolute top-4 left-0"></div>
                  
                  <div className="mt-4">
                    <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Global Tech Summit 2024</h3>
                    <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span> Oct 24
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span> San Francisco
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex justify-between items-end border-t border-white/5 pt-6">
                    <div>
                      <p className="font-label-sm text-[12px] text-on-surface-variant uppercase tracking-wider mb-1">Pass Type</p>
                      <p className="font-title-md text-[20px] text-secondary">VIP Access</p>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-lg p-2">
                      {/* Mock QR Code */}
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjMDAwIiBkPSJNMCAwaDQwdjQwaC00MHptMTAgMTBoMjB2MjBoLTIwem01MCAwaDQwdjQwaC00MHptMTAgMTBoMjB2MjBoLTIwem0tNTAgNTBoNDB2NDBoLTQwem0xMCAxMGgyMHYyMGgtMjB6bTQwLTEwaDEwdjEwaC0xMHptMjAgMGgyMHYyMGgtMjB6Ii8+PC9zdmc+')] bg-cover opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - FEATURED EVENTS */}
      <section className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex justify-between items-end mb-stack-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Featured Events</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Exclusive experiences secured on-chain.</p>
          </div>
          <button 
            onClick={() => navigate('/events')}
            className="hidden md:flex items-center gap-2 text-primary hover:text-secondary transition-colors font-label-sm text-label-sm cursor-pointer"
          >
            View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {events?.slice(0, 3).map((event) => (
            <div 
              key={event.id}
              className="group relative rounded-3xl overflow-hidden glass-panel transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(92,10,24,0.3)]"
            >
              <div className="aspect-[4/3] relative w-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ backgroundImage: `url('${getCategoryImage(event.id)}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-surface-container-highest/50 to-transparent"></div>
                <div className="absolute top-4 left-4 bg-surface-container-highest/80 backdrop-blur-md px-3 py-1 rounded-full">
                  <span className="font-label-sm text-[12px] text-on-surface">{getCategory(event.id)}</span>
                </div>
              </div>
              <div className="p-6 relative z-10 -mt-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors line-clamp-1">{event.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm mb-6">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span> {getEventDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span> On-chain
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div>
                    <span className="font-label-sm text-[12px] text-on-surface-variant block">Starting from</span>
                    <span className="font-title-md text-[18px] text-secondary">{event.ticketPrice} XLM</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/events`)}
                    className="bg-primary-container/20 text-primary hover:bg-primary-container hover:text-white px-4 py-2 rounded-full font-label-sm text-label-sm transition-colors cursor-pointer"
                  >
                    Buy Ticket
                  </button>
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-container/50 rounded-3xl transition-colors duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <button 
            onClick={() => navigate('/events')}
            className="text-primary hover:text-secondary transition-colors font-label-sm text-label-sm cursor-pointer"
          >
            View All Events
          </button>
        </div>
      </section>
    </main>
  );
};
