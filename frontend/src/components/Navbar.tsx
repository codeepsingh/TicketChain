import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { connectStellarWallet } from '../services/stellar';
import { useQueryClient } from '@tanstack/react-query';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { 
    walletAddress, 
    walletConnected, 
    networkMode, 
    tokenBalance, 
    disconnectWallet, 
    setNetworkMode 
  } = useTicketStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close mobile drawer on escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleConnect = async () => {
    await connectStellarWallet(networkMode);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    queryClient.clear();
    setDropdownOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) => {
    if (isActive(path)) {
      return "text-secondary font-bold relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-secondary after:rounded-full font-body-lg text-body-lg transition-colors duration-300";
    }
    return "text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-body-lg text-body-lg";
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/10 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_32px_0_rgba(92,10,24,0.15)]">
        <div className="flex justify-between items-center px-margin-mobile lg:px-margin-desktop py-4 max-w-container-max mx-auto relative min-h-[72px]">
        
        {/* Mobile: Hamburger + Logo Group (Left) */}
        <div className="flex items-center gap-1 lg:gap-0 z-10">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-on-surface p-1.5 focus:outline-none flex items-center justify-center cursor-pointer"
            aria-label="Open Menu"
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-headline-lg-mobile text-lg xs:text-xl sm:text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg font-bold tracking-tight text-on-surface">TicketChain</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link className={linkClass("/events")} to="/events">Events</Link>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-body-lg text-body-lg cursor-pointer" onClick={() => navigate('/')}>How It Works</a>
          <Link className={linkClass("/dashboard/organizer")} to="/dashboard/organizer">For Organizers</Link>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-body-lg text-body-lg cursor-pointer" onClick={() => navigate('/')}>Pricing</a>
          <Link className={linkClass("/dashboard")} to="/dashboard">Dashboard</Link>
        </div>

        {/* Mobile: Wallet Button (Top Right) | Desktop: Controls (Right) */}
        <div className="flex items-center gap-4">
          {/* Network Switcher Toggle (Desktop Only) */}
          <div className="hidden lg:flex items-center bg-surface-container-high rounded-full p-1 border border-white/5">
            <button 
              onClick={() => setNetworkMode('simulator')} 
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${networkMode === 'simulator' ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Sim
            </button>
            <button 
              onClick={() => setNetworkMode('testnet')} 
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${networkMode === 'testnet' ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Testnet
            </button>
          </div>

          {!walletConnected && (
            <button 
              onClick={() => navigate('/events')}
              className="hidden lg:block font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors px-4 py-2 border border-transparent cursor-pointer"
            >
              Get Started
            </button>
          )}

          {walletConnected && walletAddress ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-primary-gradient px-4 py-2 lg:px-6 lg:py-2.5 rounded-full font-label-sm text-xs lg:text-label-sm text-white active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {formatAddress(walletAddress)}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-highest border border-outline-variant/30 p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 text-xs text-on-surface-variant border-b border-white/5 mb-1">
                    Balance: <span className="text-secondary font-bold">{tokenBalance.toLocaleString()} XLM</span>
                  </div>
                  {/* Network Toggler inside dropdown for Mobile View */}
                  <div className="lg:hidden px-3 py-2 border-b border-white/5 mb-1 flex justify-between items-center text-[10px] text-on-surface-variant">
                    <span>Network</span>
                    <button 
                      onClick={() => setNetworkMode(networkMode === 'simulator' ? 'testnet' : 'simulator')}
                      className="text-secondary font-bold hover:underline"
                    >
                      {networkMode === 'simulator' ? 'Sim' : 'Testnet'}
                    </button>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleConnect}
              className="btn-primary-gradient px-4 py-2 lg:px-6 lg:py-2.5 rounded-full font-label-sm text-xs lg:text-label-sm text-white active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile Drawer (Slide-out menu from Left) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] h-full bg-surface-container-low border-r border-outline-variant/30 flex flex-col p-6 shadow-2xl transition-transform duration-300 ease-out z-10 animate-[slideRight_0.3s_ease-out]">
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-6">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-surface">TicketChain</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-2 cursor-pointer flex items-center justify-center"
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2">
              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                <span className="text-sm">Home</span>
              </Link>
              
              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/events') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/events"
              >
                <span className="material-symbols-outlined text-[20px]">explore</span>
                <span className="text-sm">Explore Events</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/create-event') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/create-event"
              >
                <span className="material-symbols-outlined text-[20px]">add_box</span>
                <span className="text-sm">Create Event</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/my-tickets') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/my-tickets"
              >
                <span className="material-symbols-outlined text-[20px]">local_activity</span>
                <span className="text-sm">My Tickets</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard') || isActive('/dashboard/organizer') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/dashboard"
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                <span className="text-sm">Dashboard</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/verify') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/verify"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span className="text-sm">Verify Tickets</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/profile') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/profile"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="text-sm">Profile</span>
              </Link>

              <Link 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/settings') ? 'bg-primary/10 border-l-4 border-primary text-on-surface font-semibold' : 'text-on-surface-variant hover:bg-white/5 border-l-4 border-transparent'}`} 
                to="/settings"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span className="text-sm">Settings</span>
              </Link>
            </nav>

            {/* Network Selector in Drawer */}
            <div className="pt-6 border-t border-white/5 mt-auto flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Stellar Network</span>
                <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setNetworkMode('simulator')} 
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${networkMode === 'simulator' ? 'bg-primary-container text-white' : 'text-on-surface-variant'}`}
                  >
                    Sim
                  </button>
                  <button 
                    onClick={() => setNetworkMode('testnet')} 
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${networkMode === 'testnet' ? 'bg-primary-container text-white' : 'text-on-surface-variant'}`}
                  >
                    Testnet
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
