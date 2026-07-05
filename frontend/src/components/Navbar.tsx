import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { initWalletKit } from '../services/stellar';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    walletAddress, 
    walletConnected, 
    networkMode, 
    tokenBalance, 
    connectWallet, 
    disconnectWallet, 
    setNetworkMode 
  } = useTicketStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleConnect = async () => {
    if (networkMode === 'simulator') {
      // Simulator connection: mock address
      const randomSimulatorAddress = 'GC' + Math.random().toString(36).substr(2, 9).toUpperCase() + 'SIMULATED';
      connectWallet(randomSimulatorAddress, 'Freighter (Sim)');
    } else {
      try {
        initWalletKit();
        const { address } = await StellarWalletsKit.authModal();
        if (address) {
          connectWallet(address, 'Freighter');
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        alert('Could not connect wallet. Make sure Freighter is installed and unlocked.');
      }
    }
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
    <nav className="fixed top-0 w-full z-50 bg-surface/10 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_32px_0_rgba(92,10,24,0.15)]">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-surface">TicketChain</span>
        </Link>

        {/* Desktop Navigation Links matching Stitch exactly */}
        <div className="hidden md:flex items-center gap-8">
          <Link className={linkClass("/events")} to="/events">Events</Link>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-body-lg text-body-lg cursor-pointer" onClick={() => navigate('/')}>How It Works</a>
          <Link className={linkClass("/dashboard/organizer")} to="/dashboard/organizer">For Organizers</Link>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-body-lg text-body-lg cursor-pointer" onClick={() => navigate('/')}>Pricing</a>
          <Link className={linkClass("/dashboard")} to="/dashboard">Dashboard</Link>
        </div>

        {/* Right side connection info */}
        <div className="hidden md:flex items-center gap-4">
          {/* Network Switcher Toggle */}
          <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-white/5">
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
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors px-4 py-2 border border-transparent cursor-pointer"
            >
              Get Started
            </button>
          )}

          {walletConnected && walletAddress ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-primary-gradient px-6 py-2.5 rounded-full font-label-sm text-label-sm text-white active:scale-95 transition-transform flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {formatAddress(walletAddress)}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-highest border border-outline-variant/30 p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 text-xs text-on-surface-variant border-b border-white/5 mb-1">
                    Balance: <span className="text-secondary font-bold">{tokenBalance.toLocaleString()} XLM</span>
                  </div>
                  <button 
                    onClick={() => {
                      disconnectWallet();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
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
              className="btn-primary-gradient px-6 py-2.5 rounded-full font-label-sm text-label-sm text-white active:scale-95 transition-transform flex items-center gap-2"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-on-surface p-2"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container border-b border-outline-variant/20 p-6 flex flex-col gap-4 animate-[slideDown_0.3s_ease-out]">
          <Link onClick={() => setMobileMenuOpen(false)} className="text-on-surface font-medium py-2 border-b border-white/5" to="/events">Events</Link>
          <a onClick={() => { setMobileMenuOpen(false); navigate('/'); }} className="text-on-surface font-medium py-2 border-b border-white/5 cursor-pointer">How It Works</a>
          <Link onClick={() => setMobileMenuOpen(false)} className="text-on-surface font-medium py-2 border-b border-white/5" to="/dashboard/organizer">For Organizers</Link>
          <a onClick={() => { setMobileMenuOpen(false); navigate('/'); }} className="text-on-surface font-medium py-2 border-b border-white/5 cursor-pointer">Pricing</a>
          <Link onClick={() => setMobileMenuOpen(false)} className="text-on-surface font-medium py-2 border-b border-white/5" to="/dashboard">Dashboard</Link>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-on-surface-variant font-medium">Network</span>
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
          
          {walletConnected && walletAddress ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="text-sm text-on-surface-variant">
                Address: <span className="text-on-surface font-mono">{formatAddress(walletAddress)}</span>
              </div>
              <div className="text-sm text-on-surface-variant">
                Balance: <span className="text-secondary font-bold">{tokenBalance.toLocaleString()} XLM</span>
              </div>
              <button 
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-red-950/30 border border-red-500/20 text-red-400 py-3 rounded-full text-center text-sm font-semibold transition-colors mt-2"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                handleConnect();
                setMobileMenuOpen(false);
              }}
              className="btn-primary-gradient w-full py-3 rounded-full font-label-sm text-label-sm text-white text-center font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
