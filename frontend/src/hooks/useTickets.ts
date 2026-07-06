import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTicketStore } from '../store/useTicketStore';
import { StellarService } from '../services/stellar';

export const useEvents = () => {
  const { events, networkMode } = useTicketStore();

  return useQuery({
    queryKey: ['events', networkMode],
    queryFn: async () => {
      if (networkMode === 'simulator') {
        return events;
      }
      return events.filter((e) => e.onChain === true);
    },
    initialData: networkMode === 'simulator' ? events : events.filter((e) => e.onChain === true),
  });
};

export const useTickets = (userAddress: string | null) => {
  const { tickets, networkMode } = useTicketStore();

  return useQuery({
    queryKey: ['tickets', userAddress, networkMode],
    queryFn: async () => {
      if (!userAddress) return [];
      
      if (networkMode === 'simulator') {
        return tickets.filter((t) => t.owner === userAddress);
      }
      
      return tickets.filter((t) => t.owner === userAddress);
    },
    enabled: !!userAddress,
    initialData: [],
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { name: string; price: number; maxTickets: number; date: number }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Create Event: ${params.name}`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        const eventId = store.simCreateEvent(params.name, params.price, params.maxTickets, params.date);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return eventId;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Create Event (${params.name})`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const { txHash, eventId } = await StellarService.createEvent(
            store.managerContractId,
            store.walletAddress,
            params.name,
            params.price,
            params.maxTickets,
            params.date
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simCreateEvent(params.name, params.price, params.maxTickets, params.date, eventId);
          
          return txHash;
        } catch (error: any) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const usePurchaseTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number; quantity: number }) => {
      const txId = `tx_${Date.now()}`;
      const event = store.events.find(e => e.id === params.eventId);
      const label = event ? `Buy ${params.quantity}x Tickets for "${event.name}"` : 'Purchase Tickets';
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        store.simPurchaseTicket(params.eventId, params.quantity);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        // Prevent purchasing mock/default events on Testnet
        const targetEvent = store.events.find(e => e.id === params.eventId);
        if (targetEvent && !targetEvent.onChain) {
          throw new Error('Default simulator events do not exist on the Testnet contract. Please switch Network Mode to "Sim" to test with mock events, or "Create Event" on Testnet to buy live tickets!');
        }

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Purchase Tickets`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.purchaseTicket(
            store.managerContractId,
            store.walletAddress,
            params.eventId,
            params.quantity
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simPurchaseTicket(params.eventId, params.quantity);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useTransferTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { ticketId: number; toAddress: string }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Transfer Ticket #${params.ticketId}`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1200));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simTransferTicket(params.ticketId, params.toAddress);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Transfer Ticket #${params.ticketId}`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.transferTicket(
            store.managerContractId,
            store.walletAddress,
            params.ticketId,
            params.toAddress
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simTransferTicket(params.ticketId, params.toAddress);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useVerifyTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { ticketId: number }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Verify Ticket Gate Entry #${params.ticketId}`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simVerifyTicket(params.ticketId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Gate Verification Ticket #${params.ticketId}`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.verifyTicket(
            store.managerContractId,
            store.walletAddress,
            params.ticketId
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simVerifyTicket(params.ticketId);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useCancelEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Cancel Event ID ${params.eventId}`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        store.simCancelEvent(params.eventId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Cancel Event ID ${params.eventId}`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.cancelEvent(
            store.managerContractId,
            store.walletAddress,
            params.eventId
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simCancelEvent(params.eventId);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useCompleteEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Complete Event & Disburse Payouts (ID ${params.eventId})`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        store.simCompleteEvent(params.eventId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Disburse Event Payouts (ID ${params.eventId})`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.completeEvent(
            store.managerContractId,
            store.walletAddress,
            params.eventId
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simCompleteEvent(params.eventId);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useClaimRefund = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number; ticketId: number }) => {
      const txId = `tx_${Date.now()}`;
      
      if (store.networkMode === 'simulator') {
        store.addTransaction({
          id: txId,
          label: `Claim Ticket Refund #${params.ticketId}`,
          status: 'pending',
        });
        
        await new Promise((resolve) => setTimeout(resolve, 1200));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simClaimRefund(params.eventId, params.ticketId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));
        
        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected');
        
        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Claim Ticket Refund #${params.ticketId}`,
          status: 'pending',
        });
        
        try {
          store.updateTransaction(txId, 'processing');
          const txHash = await StellarService.claimRefund(
            store.managerContractId,
            store.walletAddress,
            params.eventId,
            params.ticketId
          );
          
          store.updateTransaction(txId, 'confirmed', txHash);
          store.simClaimRefund(params.eventId, params.ticketId);
          
          return txHash;
        } catch (error) {
          store.updateTransaction(txId, 'failed');
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
