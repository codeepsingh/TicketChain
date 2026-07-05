import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EventInfo {
  id: number;
  organizer: string;
  name: string;
  ticketPrice: number; // in XLM/USDC token units
  maxTickets: number;
  soldTickets: number;
  date: number; // Unix timestamp
  status: 0 | 1 | 2; // 0: Open, 1: Cancelled, 2: Completed
}

export interface TicketInfo {
  id: number;
  eventId: number;
  owner: string;
  originalBuyer: string;
  verified: boolean;
}

export interface LedgerActivity {
  id: string;
  timestamp: number;
  type: 'event_created' | 'ticket_purchased' | 'ticket_transferred' | 'ticket_verified' | 'event_cancelled' | 'event_completed' | 'funds_withdrawn';
  details: string;
  txHash: string;
}

export interface TransactionStatus {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
}

interface TicketStore {
  // Wallet & Config
  walletAddress: string | null;
  walletConnected: boolean;
  walletName: string | null;
  networkMode: 'simulator' | 'testnet';
  tokenBalance: number;
  managerContractId: string;
  escrowContractId: string;

  // Ledger Data
  events: EventInfo[];
  tickets: TicketInfo[];
  verifiers: Record<number, string[]>; // eventId -> verifier addresses

  // Telemetry & Feed
  activities: LedgerActivity[];
  transactions: TransactionStatus[];

  // Setters & Connection Actions
  connectWallet: (address: string, walletName: string) => void;
  disconnectWallet: () => void;
  setNetworkMode: (mode: 'simulator' | 'testnet') => void;
  setContractIds: (managerId: string, escrowId: string) => void;
  updateTokenBalance: (balance: number) => void;
  
  // Transaction Logging
  addTransaction: (tx: Omit<TransactionStatus, 'timestamp'>) => void;
  updateTransaction: (id: string, status: TransactionStatus['status'], txHash?: string) => void;
  addActivity: (activity: Omit<LedgerActivity, 'id' | 'timestamp' | 'txHash'>) => void;

  // Simulator Mutation Actions (Fallback for simulator mode)
  simCreateEvent: (name: string, price: number, maxTickets: number, date: number) => number;
  simPurchaseTicket: (eventId: number, quantity: number) => void;
  simTransferTicket: (ticketId: number, toAddress: string) => void;
  simVerifyTicket: (ticketId: number) => void;
  simAddVerifier: (eventId: number, verifier: string) => void;
  simCancelEvent: (eventId: number) => void;
  simCompleteEvent: (eventId: number) => void;
  simClaimRefund: (eventId: number, ticketId: number) => void;
}

// Initial default events for the simulator to make the app look alive immediately
const defaultEvents: EventInfo[] = [
  {
    id: 1,
    organizer: 'GDG6XORGANIZER...TESTNET',
    name: 'Stellar Orange Belt Developer Summit 2026',
    ticketPrice: 25,
    maxTickets: 100,
    soldTickets: 42,
    date: Date.now() / 1000 + 86400 * 30, // 30 days from now
    status: 0,
  },
  {
    id: 2,
    organizer: 'GABCONCERT...TESTNET',
    name: 'Soroban Smart Contract Beats & Bass',
    ticketPrice: 15,
    maxTickets: 50,
    soldTickets: 50, // Sold out
    date: Date.now() / 1000 + 86400 * 15, // 15 days from now
    status: 0,
  },
  {
    id: 3,
    organizer: 'GCELES...TESTNET',
    name: 'Web3 TicketChain Grand Gala',
    ticketPrice: 150,
    maxTickets: 15,
    soldTickets: 8,
    date: Date.now() / 1000 + 86400 * 5, // 5 days from now
    status: 0,
  }
];

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      walletConnected: false,
      walletName: null,
      networkMode: 'simulator',
      tokenBalance: 1000, // Initial simulator tokens
      managerContractId: 'CC3TICKETMANAGER...TESTNET',
      escrowContractId: 'CC3TICKETESCROW...TESTNET',

      events: defaultEvents,
      tickets: [],
      verifiers: {
        1: ['GDG6XORGANIZER...TESTNET'],
        2: ['GABCONCERT...TESTNET'],
        3: ['GCELES...TESTNET'],
      },
      activities: [
        {
          id: 'act_1',
          timestamp: Date.now() - 3600000 * 4,
          type: 'event_created',
          details: 'Event "Stellar Orange Belt Developer Summit 2026" created by GDG6XORGANIZER...',
          txHash: '0x8fa3...d8ea'
        },
        {
          id: 'act_2',
          timestamp: Date.now() - 3600000 * 2,
          type: 'event_created',
          details: 'Event "Soroban Smart Contract Beats & Bass" created by GABCONCERT...',
          txHash: '0xa2b5...7f1c'
        }
      ],
      transactions: [],

      connectWallet: (address, walletName) => {
        // Initialize simulator tickets for this wallet so the dashboard starts with some data
        const currentTickets = get().tickets;
        let newTickets = [...currentTickets];
        
        // If the user has no tickets yet, give them a couple of mock tickets for testing
        if (currentTickets.filter(t => t.owner === address).length === 0) {
          newTickets = [
            ...currentTickets,
            {
              id: 101,
              eventId: 1,
              owner: address,
              originalBuyer: address,
              verified: false,
            },
            {
              id: 102,
              eventId: 3,
              owner: address,
              originalBuyer: address,
              verified: true, // Scanned
            }
          ];
        }

        set({
          walletAddress: address,
          walletConnected: true,
          walletName: walletName,
          tickets: newTickets,
        });

        // Add transaction log
        get().addTransaction({
          id: `tx_${Date.now()}`,
          label: `Connect ${walletName} Wallet`,
          status: 'confirmed',
        });
      },

      disconnectWallet: () => {
        set({
          walletAddress: null,
          walletConnected: false,
          walletName: null,
        });
      },

      setNetworkMode: (mode) => set({ networkMode: mode }),
      setContractIds: (managerId, escrowId) => set({ managerContractId: managerId, escrowContractId: escrowId }),
      updateTokenBalance: (balance) => set({ tokenBalance: balance }),

      addTransaction: (tx) => {
        const newTx: TransactionStatus = {
          ...tx,
          timestamp: Date.now(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 20), // Keep last 20
        }));
      },

      updateTransaction: (id, status, txHash) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, status, txHash: txHash || t.txHash } : t
          ),
        }));
      },

      addActivity: (activity) => {
        const newActivity: LedgerActivity = {
          ...activity,
          id: `act_${Date.now()}`,
          timestamp: Date.now(),
          txHash: '0x' + Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 8),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 30), // Keep last 30
        }));
      },

      // Simulator mutations
      simCreateEvent: (name, price, maxTickets, date) => {
        const organizer = get().walletAddress || 'G_SIMULATED_USER...TESTNET';
        const newId = get().events.length + 1;
        const newEvent: EventInfo = {
          id: newId,
          organizer,
          name,
          ticketPrice: price,
          maxTickets,
          soldTickets: 0,
          date,
          status: 0,
        };

        set((state) => ({
          events: [...state.events, newEvent],
          verifiers: {
            ...state.verifiers,
            [newId]: [organizer], // Organizer is verifier by default
          },
        }));

        get().addActivity({
          type: 'event_created',
          details: `Event "${name}" (ID: ${newId}) created by ${organizer.slice(0, 8)}...`,
        });

        return newId;
      },

      simPurchaseTicket: (eventId, quantity) => {
        const buyer = get().walletAddress || 'G_SIMULATED_USER...TESTNET';
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;

        const totalCost = event.ticketPrice * quantity;
        if (get().tokenBalance < totalCost) {
          throw new Error('Insufficient simulated balance');
        }

        const currentCounter = get().tickets.length + 200; // Counter starts at 200 for simulated
        const newTickets: TicketInfo[] = [];

        for (let i = 0; i < quantity; i++) {
          newTickets.push({
            id: currentCounter + i,
            eventId,
            owner: buyer,
            originalBuyer: buyer,
            verified: false,
          });
        }

        set((state) => ({
          tokenBalance: state.tokenBalance - totalCost,
          tickets: [...state.tickets, ...newTickets],
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, soldTickets: e.soldTickets + quantity } : e
          ),
        }));

        get().addActivity({
          type: 'ticket_purchased',
          details: `${buyer.slice(0, 8)}... purchased ${quantity} tickets for "${event.name}"`,
        });
      },

      simTransferTicket: (ticketId, toAddress) => {
        const from = get().walletAddress || '';
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket) return;

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, owner: toAddress } : t
          ),
        }));

        get().addActivity({
          type: 'ticket_transferred',
          details: `Ticket #${ticketId} transferred from ${from.slice(0, 8)}... to ${toAddress.slice(0, 8)}...`,
        });
      },

      simVerifyTicket: (ticketId) => {
        const verifier = get().walletAddress || 'G_SIMULATED_VERIFIER';
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket) return;

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, verified: true } : t
          ),
        }));

        get().addActivity({
          type: 'ticket_verified',
          details: `Ticket #${ticketId} scanned and verified at the gate by verifier ${verifier.slice(0, 8)}...`,
        });
      },

      simAddVerifier: (eventId, verifier) => {
        const currentVerifiers = get().verifiers[eventId] || [];
        if (currentVerifiers.includes(verifier)) return;

        set((state) => ({
          verifiers: {
            ...state.verifiers,
            [eventId]: [...currentVerifiers, verifier],
          },
        }));

        get().addActivity({
          type: 'event_created', // Just log as general log
          details: `Address ${verifier.slice(0, 8)}... added as authorized verifier for Event ID ${eventId}`,
        });
      },

      simCancelEvent: (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;

        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, status: 1 } : e
          ),
        }));

        get().addActivity({
          type: 'event_cancelled',
          details: `Event "${event.name}" (ID: ${eventId}) cancelled by organizer. Refunds enabled!`,
        });
      },

      simCompleteEvent: (eventId) => {
        const organizer = get().walletAddress || '';
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;

        const payout = event.ticketPrice * event.soldTickets;

        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, status: 2 } : e
          ),
          tokenBalance: event.organizer === organizer ? state.tokenBalance + payout : state.tokenBalance,
        }));

        get().addActivity({
          type: 'event_completed',
          details: `Event "${event.name}" marked complete. Released ${payout} tokens to organizer.`,
        });
      },

      simClaimRefund: (eventId, ticketId) => {
        const buyer = get().walletAddress || '';
        const ticket = get().tickets.find((t) => t.id === ticketId);
        const event = get().events.find((e) => e.id === eventId);
        if (!ticket || !event) return;

        // Verify ownership and event status
        if (ticket.owner !== buyer || event.status !== 1) return;

        set((state) => ({
          tokenBalance: state.tokenBalance + event.ticketPrice,
          tickets: state.tickets.filter((t) => t.id !== ticketId),
        }));

        get().addActivity({
          type: 'funds_withdrawn',
          details: `Buyer ${buyer.slice(0, 8)}... claimed refund of ${event.ticketPrice} tokens for Ticket #${ticketId}`,
        });
      }
    }),
    {
      name: 'ticketchain-storage',
      partialize: (state) => ({
        events: state.events,
        tickets: state.tickets,
        verifiers: state.verifiers,
        tokenBalance: state.tokenBalance,
        activities: state.activities,
        managerContractId: state.managerContractId,
        escrowContractId: state.escrowContractId,
        networkMode: state.networkMode,
      }),
    }
  )
);
