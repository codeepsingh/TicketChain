import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTicketStore } from '../store/useTicketStore';
import { StellarService } from '../services/stellar';

// ─────────────────────────────────────────────
// useEvents — returns ONLY the events for the
// active network mode. Modes NEVER mix.
// ─────────────────────────────────────────────
export const useEvents = () => {
  const { simEvents, testnetEvents, networkMode } = useTicketStore();

  return useQuery({
    queryKey: ['events', networkMode],
    queryFn: async () => {
      if (networkMode === 'simulator') {
        return simEvents;
      }
      return testnetEvents;
    },
    initialData: networkMode === 'simulator' ? simEvents : testnetEvents,
    // Refetch from store slice when store changes
    staleTime: 0,
  });
};

// ─────────────────────────────────────────────
// useTickets — returns ONLY the tickets for the
// active network mode and current wallet.
// ─────────────────────────────────────────────
export const useTickets = (userAddress: string | null) => {
  const { simTickets, testnetTickets, networkMode } = useTicketStore();

  return useQuery({
    queryKey: ['tickets', userAddress, networkMode],
    queryFn: async () => {
      if (!userAddress) return [];
      if (networkMode === 'simulator') {
        return simTickets.filter((t) => t.owner === userAddress);
      }
      return testnetTickets.filter((t) => t.owner === userAddress);
    },
    enabled: !!userAddress,
    initialData: [],
    staleTime: 0,
  });
};

// ─────────────────────────────────────────────
// useCreateEvent
// ─────────────────────────────────────────────
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { name: string; price: number; maxTickets: number; date: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `Create Event: ${params.name}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        const eventId = store.simCreateEvent(params.name, params.price, params.maxTickets, params.date);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return eventId;
      } else {
        // ── TESTNET PATH ──
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

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

          // ── Store in TESTNET array only ──
          store.addTestnetEvent({
            id: eventId,
            organizer: store.walletAddress,
            name: params.name,
            ticketPrice: params.price,
            maxTickets: params.maxTickets,
            soldTickets: 0,
            date: params.date,
            status: 0,
          });

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

// ─────────────────────────────────────────────
// usePurchaseTicket
// ─────────────────────────────────────────────
export const usePurchaseTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number; quantity: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        // ── SIMULATOR PATH — only uses simEvents ──
        const event = store.simEvents.find((e) => e.id === params.eventId);
        if (!event) throw new Error(`Simulator event #${params.eventId} not found.`);

        store.addTransaction({
          id: txId,
          label: `[Sim] Buy ${params.quantity}x Tickets for "${event.name}"`,
          status: 'pending',
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 800));

        store.simPurchaseTicket(params.eventId, params.quantity);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        // ── TESTNET PATH — only uses testnetEvents ──
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

        const event = store.testnetEvents.find((e) => e.id === params.eventId);
        if (!event) {
          throw new Error(
            `Event #${params.eventId} does not exist on Testnet. Only events created on-chain can be purchased. Please use "Create Event" to deploy a new event to the Stellar Testnet contract.`
          );
        }

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Buy ${params.quantity}x Tickets for "${event.name}"`,
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

          // Store purchased tickets in TESTNET array
          const buyer = store.walletAddress;
          const newTickets = Array.from({ length: params.quantity }, (_, i) => ({
            id: Date.now() + i,
            eventId: params.eventId,
            owner: buyer,
            originalBuyer: buyer,
            verified: false,
          }));
          store.addTestnetTickets(newTickets);
          store.updateTestnetEventSoldCount(params.eventId, params.quantity);

          store.addActivity({
            type: 'ticket_purchased',
            details: `${buyer.slice(0, 8)}... purchased ${params.quantity} ticket(s) for "${event.name}" on Testnet`,
          });

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

// ─────────────────────────────────────────────
// useTransferTicket
// ─────────────────────────────────────────────
export const useTransferTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { ticketId: number; toAddress: string }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `[Sim] Transfer Ticket #${params.ticketId}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1200));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simTransferTicket(params.ticketId, params.toAddress);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

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
          // Update testnet ticket owner locally
          store.addTestnetTickets(
            store.testnetTickets
              .filter((t) => t.id === params.ticketId)
              .map((t) => ({ ...t, owner: params.toAddress }))
          );

          store.addActivity({
            type: 'ticket_transferred',
            details: `Ticket #${params.ticketId} transferred to ${params.toAddress.slice(0, 8)}... on Testnet`,
          });

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

// ─────────────────────────────────────────────
// useVerifyTicket
// ─────────────────────────────────────────────
export const useVerifyTicket = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { ticketId: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `[Sim] Verify Ticket #${params.ticketId}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simVerifyTicket(params.ticketId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Verify Ticket #${params.ticketId}`,
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
          store.updateTestnetTicketVerified(params.ticketId);

          store.addActivity({
            type: 'ticket_verified',
            details: `Ticket #${params.ticketId} verified on Testnet`,
          });

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

// ─────────────────────────────────────────────
// useCancelEvent
// ─────────────────────────────────────────────
export const useCancelEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `[Sim] Cancel Event #${params.eventId}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simCancelEvent(params.eventId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Cancel Event #${params.eventId}`,
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
          store.addActivity({
            type: 'event_cancelled',
            details: `Event #${params.eventId} cancelled on Testnet`,
          });

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

// ─────────────────────────────────────────────
// useClaimRefund
// ─────────────────────────────────────────────
export const useClaimRefund = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number; ticketId: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `[Sim] Claim Refund for Ticket #${params.ticketId}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simClaimRefund(params.eventId, params.ticketId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Claim Refund for Ticket #${params.ticketId}`,
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
          store.addActivity({
            type: 'funds_withdrawn',
            details: `Refund claimed for Ticket #${params.ticketId} on Testnet`,
          });

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

// ─────────────────────────────────────────────
// useCompleteEvent (Organizer Dashboard)
// ─────────────────────────────────────────────
export const useCompleteEvent = () => {
  const queryClient = useQueryClient();
  const store = useTicketStore();

  return useMutation({
    mutationFn: async (params: { eventId: number }) => {
      const txId = `tx_${Date.now()}`;

      if (store.networkMode === 'simulator') {
        store.addTransaction({ id: txId, label: `[Sim] Complete Event #${params.eventId}`, status: 'pending' });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        store.updateTransaction(txId, 'processing');
        await new Promise((resolve) => setTimeout(resolve, 500));

        store.simCompleteEvent(params.eventId);
        store.updateTransaction(txId, 'confirmed', '0x_sim_hash_' + Math.random().toString(36).substr(2, 6));

        return true;
      } else {
        if (!store.walletAddress) throw new Error('Wallet not connected. Please connect Freighter first.');

        store.addTransaction({
          id: txId,
          label: `Stellar Soroban: Complete Event #${params.eventId}`,
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
          store.addActivity({
            type: 'event_completed',
            details: `Event #${params.eventId} completed on Testnet`,
          });

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
