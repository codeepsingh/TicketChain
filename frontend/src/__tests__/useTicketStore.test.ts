import { describe, it, expect, beforeEach } from 'vitest';
import { useTicketStore } from '../store/useTicketStore';

describe('useTicketStore', () => {
  beforeEach(() => {
    const { disconnectWallet, setNetworkMode } = useTicketStore.getState();
    disconnectWallet();
    setNetworkMode('simulator');
  });

  it('should support connecting and disconnecting wallet', () => {
    const store = useTicketStore.getState();
    expect(store.walletConnected).toBe(false);
    expect(store.walletAddress).toBeNull();

    store.connectWallet('G_MOCK_ADDRESS', 'Freighter');

    const updatedStore = useTicketStore.getState();
    expect(updatedStore.walletConnected).toBe(true);
    expect(updatedStore.walletAddress).toBe('G_MOCK_ADDRESS');
    expect(updatedStore.walletName).toBe('Freighter');

    updatedStore.disconnectWallet();
    const disconnectedStore = useTicketStore.getState();
    expect(disconnectedStore.walletConnected).toBe(false);
    expect(disconnectedStore.walletAddress).toBeNull();
  });

  it('should support purchasing tickets in simulator mode', () => {
    const store = useTicketStore.getState();
    store.connectWallet('G_MOCK_ADDRESS', 'Freighter');
    
    // Reset balance to 1000 for predictability
    useTicketStore.setState({ tokenBalance: 1000 });
    
    // Purchase 2 tickets for event 1 (price 25 each, total 50)
    store.simPurchaseTicket(1, 2);
    
    const updatedStore = useTicketStore.getState();
    expect(updatedStore.tokenBalance).toBe(950);
    
    const userTickets = updatedStore.simTickets.filter((t: any) => t.owner === 'G_MOCK_ADDRESS');
    expect(userTickets.length).toBeGreaterThanOrEqual(2);
  });
});
