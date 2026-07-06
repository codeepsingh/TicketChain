import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TransactionFeed } from './components/TransactionFeed';
import { streamLedgerEvents, StellarService } from './services/stellar';
import { useTicketStore } from './store/useTicketStore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { CreateEventPage } from './pages/CreateEventPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { TicketDetailsPage } from './pages/TicketDetailsPage';
import { VerifyPage } from './pages/VerifyPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const App: React.FC = () => {
  const { 
    managerContractId, 
    escrowContractId, 
    setContractIds, 
    networkMode, 
    addActivity, 
    walletAddress, 
    walletConnected, 
    updateTokenBalance,
    purgeInvalidTestnetEvents,
    setNetworkMode,
  } = useTicketStore();

  // ── On mount: sanitize stored config & force testnet mode ──
  useEffect(() => {
    const defaultManager = import.meta.env.VITE_TICKET_MANAGER_CONTRACT || 'CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O';
    const defaultEscrow = import.meta.env.VITE_TICKET_ESCROW_CONTRACT || 'CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3';
    
    if (
      !managerContractId || managerContractId.length !== 56 || !managerContractId.startsWith('C') ||
      !escrowContractId || escrowContractId.length !== 56 || !escrowContractId.startsWith('C')
    ) {
      console.log('[App] Sanitizing invalid persisted contract IDs...');
      setContractIds(defaultManager, defaultEscrow);
    }

    // Always lock to testnet (sim toggle was removed from UI)
    if (networkMode !== 'testnet') {
      setNetworkMode('testnet');
    }

    // Remove any events stored with invalid IDs (e.g. from a failed create_event decode)
    purgeInvalidTestnetEvents();
  }, []);

  useEffect(() => {
    if (networkMode !== 'testnet') return;

    try {
      const closeStream = streamLedgerEvents(managerContractId, (event) => {
        // Log event details in browser and push to activity store
        console.log('Stellar Ledger Event Received:', event);
        addActivity({
          type: 'ticket_purchased',
          details: `Ledger Event: Action detected on contract ${managerContractId.slice(0, 8)}...`,
        });
      });
      return () => {
        closeStream();
      };
    } catch (e) {
      console.error('Failed to initialize Stellar Event Stream:', e);
    }
  }, [managerContractId, networkMode, addActivity]);

  useEffect(() => {
    if (networkMode !== 'testnet' || !walletConnected || !walletAddress) return;

    let active = true;
    const fetchBalance = async () => {
      try {
        const bal = await StellarService.getAccountBalance(walletAddress);
        if (active) {
          updateTokenBalance(bal);
        }
      } catch (err) {
        console.error('Error syncing balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000); // Sync balance every 15s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [walletAddress, walletConnected, networkMode, updateTokenBalance]);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<ExplorePage />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/dashboard/organizer" element={<OrganizerDashboardPage />} />
              <Route path="/my-tickets" element={<MyTicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailsPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
          
          <Footer />
          <TransactionFeed />
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
