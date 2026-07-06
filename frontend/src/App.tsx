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
  const { managerContractId, networkMode, addActivity, walletAddress, walletConnected, updateTokenBalance } = useTicketStore();

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
